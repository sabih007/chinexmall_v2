import "server-only";

import { formatPrice } from "@/lib/format";
import {
  deliveryMethod,
  formatPhone,
  isEmailAddress,
  paymentMethod,
} from "@/lib/orders";
import { bankAccount, site } from "@/lib/site";
import { alertRecipient, mailEnabled, sendMail } from "./mailer.server";
import type { Order } from "@/lib/types";

/**
 * The two emails an order produces:
 *
 *   1. "New order" to the shop — `ORDER_ALERT_EMAIL`, defaulting to
 *      `site.email`. Everything needed to pack and dispatch without opening
 *      the dashboard, and `Reply-To` set to the customer so answering the
 *      alert answers the customer.
 *   2. The customer's confirmation — only when they gave an email address, as
 *      a phone number alone is enough to place a cash-on-delivery order.
 *
 * Both are plain-text-plus-HTML with no images, no tracking pixel and no
 * remote assets: a single-image email with a beacon in it is the shape spam
 * filters are built to catch, and it renders as an empty box in the clients
 * that block remote content by default.
 */

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                               */
/* -------------------------------------------------------------------------- */

const INK = "#0b1c3d";
const MUTED = "#6f7d99";
const LINE = "#e2e9f5";
const SAND = "#f4f7fc";
const BRAND = "#0a5ce0";

/** Escapes a customer-supplied string before it goes anywhere near the HTML. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fullName(order: Order): string {
  const name = `${order.customer.firstName} ${order.customer.lastName}`.trim();
  return name || "Guest";
}

/** The address as a courier would read it, one line per element. */
function addressLines(order: Order): string[] {
  const c = order.customer;
  return [
    c.address1,
    c.address2,
    [c.city, c.province].filter(Boolean).join(", "),
    c.postalCode,
  ].filter((line) => line.trim().length > 0);
}

interface Row {
  label: string;
  value: string;
  /** Renders bolder and larger — used for the total. */
  strong?: boolean;
}

function totalRows(order: Order): Row[] {
  const t = order.totals;
  const rows: Row[] = [{ label: "Subtotal", value: formatPrice(t.subtotal) }];
  if (t.discount > 0) {
    rows.push({
      label: order.coupon ? `Discount (${order.coupon.code})` : "Discount",
      value: `− ${formatPrice(t.discount)}`,
    });
  }
  rows.push({
    label: `Delivery (${deliveryMethod(order.delivery).label})`,
    value: t.delivery === 0 ? "Free" : formatPrice(t.delivery),
  });
  if (t.codFee > 0) {
    rows.push({ label: "Cash handling", value: formatPrice(t.codFee) });
  }
  rows.push({ label: "Total", value: formatPrice(t.total), strong: true });
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  Plain-text parts                                                          */
/* -------------------------------------------------------------------------- */

function itemsText(order: Order): string {
  return order.lines
    .map((line) => {
      const variant = line.variantLabel ? ` (${line.variantLabel})` : "";
      return `  ${line.quantity} × ${line.name}${variant}  —  ${formatPrice(line.lineTotal)}`;
    })
    .join("\n");
}

function totalsText(order: Order): string {
  return totalRows(order)
    .map((row) => `  ${row.label}: ${row.value}`)
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/*  HTML parts                                                                */
/*                                                                            */
/*  Tables and inline styles throughout. Not nostalgia: Outlook and Gmail     */
/*  still strip <style> blocks and ignore most of flexbox, so anything built  */
/*  the way the site is built would arrive unstyled.                          */
/* -------------------------------------------------------------------------- */

function shell(heading: string, preheader: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${SAND};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
<tr><td style="padding:24px 28px 8px;">
  <div style="font-size:18px;font-weight:700;letter-spacing:-0.2px;">${esc(site.name)}</div>
</td></tr>
${body}
<tr><td style="padding:20px 28px 28px;border-top:1px solid ${LINE};color:${MUTED};font-size:12px;line-height:1.6;">
  ${esc(site.name)} · ${esc(site.address)}<br>
  <a href="mailto:${esc(site.email)}" style="color:${MUTED};">${esc(site.email)}</a>
  · <a href="tel:${esc(site.phone.replace(/\s/g, ""))}" style="color:${MUTED};">${esc(site.phone)}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function itemsHtml(order: Order): string {
  const rows = order.lines
    .map((line) => {
      const variant = line.variantLabel
        ? `<div style="color:${MUTED};font-size:13px;">${esc(line.variantLabel)}</div>`
        : "";
      return `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;line-height:1.5;">
    <strong style="font-weight:600;">${esc(line.name)}</strong>${variant}
    <div style="color:${MUTED};font-size:13px;">Qty ${line.quantity} × ${formatPrice(line.unitPrice)}</div>
  </td>
  <td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;white-space:nowrap;vertical-align:top;">
    ${formatPrice(line.lineTotal)}
  </td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

function totalsHtml(order: Order): string {
  const rows = totalRows(order)
    .map((row) => {
      const weight = row.strong ? "600" : "400";
      const size = row.strong ? "16px" : "14px";
      const top = row.strong
        ? `border-top:1px solid ${LINE};padding-top:10px;`
        : "";
      return `<tr>
  <td style="padding:4px 0;${top}font-size:${size};font-weight:${weight};color:${row.strong ? INK : MUTED};">${esc(row.label)}</td>
  <td align="right" style="padding:4px 0;${top}font-size:${size};font-weight:${weight};white-space:nowrap;">${esc(row.value)}</td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">${rows}</table>`;
}

function panel(title: string, lines: string[]): string {
  return `<div style="background:${SAND};border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6;">
  <div style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};margin-bottom:4px;">${esc(title)}</div>
  ${lines.map((line) => esc(line)).join("<br>")}
</div>`;
}

/* -------------------------------------------------------------------------- */
/*  1. The shop's alert                                                       */
/* -------------------------------------------------------------------------- */

function shopAlert(order: Order) {
  const who = fullName(order);
  const phone = formatPhone(order.customer.phone);
  const total = formatPrice(order.totals.total);
  const pay = paymentMethod(order.payment).label;
  const units = order.lines.reduce((n, l) => n + l.quantity, 0);
  const address = addressLines(order);
  const dashboard = `${site.url}/admin/orders/${order.number}`;

  /* The number and the money in the subject, so the inbox list alone tells
     you whether this one needs opening now. */
  const subject = `New order ${order.number} — ${total} (${pay})`;

  const text = [
    `New order ${order.number}`,
    "",
    `Total:    ${total}`,
    `Payment:  ${pay}`,
    `Delivery: ${deliveryMethod(order.delivery).label} · ${order.eta}`,
    `Items:    ${units}`,
    "",
    "ITEMS",
    itemsText(order),
    "",
    "TOTALS",
    totalsText(order),
    "",
    "CUSTOMER",
    `  ${who}`,
    `  ${phone}`,
    ...(order.customer.email ? [`  ${order.customer.email}`] : []),
    "",
    "DELIVER TO",
    ...address.map((line) => `  ${line}`),
    ...(order.customer.notes ? ["", "NOTES", `  ${order.customer.notes}`] : []),
    "",
    `Open in the dashboard: ${dashboard}`,
  ].join("\n");

  const html = shell(
    `New order ${order.number}`,
    `${total} · ${pay} · ${who}, ${order.customer.city}`,
    `<tr><td style="padding:0 28px 20px;">
  <div style="font-size:22px;font-weight:700;letter-spacing:-0.4px;">New order ${esc(order.number)}</div>
  <div style="color:${MUTED};font-size:14px;margin-top:4px;">
    ${esc(total)} · ${esc(pay)} · ${units} ${units === 1 ? "item" : "items"}
  </div>

  <div style="margin-top:20px;">${itemsHtml(order)}</div>
  ${totalsHtml(order)}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
    <tr><td style="padding-bottom:10px;">${panel("Customer", [
      who,
      phone,
      ...(order.customer.email ? [order.customer.email] : []),
    ])}</td></tr>
    <tr><td style="padding-bottom:10px;">${panel("Deliver to", address)}</td></tr>
    <tr><td style="padding-bottom:10px;">${panel("Delivery", [
      deliveryMethod(order.delivery).label,
      order.eta,
    ])}</td></tr>
    ${
      order.customer.notes
        ? `<tr><td>${panel("Customer notes", [order.customer.notes])}</td></tr>`
        : ""
    }
  </table>

  <div style="margin-top:22px;">
    <a href="${esc(dashboard)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">Open in the dashboard</a>
  </div>
</td></tr>`,
  );

  return {
    to: alertRecipient,
    subject,
    text,
    html,
    /* So hitting reply on the alert writes to the customer, not to yourself. */
    ...(isEmailAddress(order.customer.email)
      ? { replyTo: order.customer.email }
      : {}),
    idempotencyKey: `order-${order.number}-alert`,
  };
}

/* -------------------------------------------------------------------------- */
/*  2. The customer's confirmation                                            */
/* -------------------------------------------------------------------------- */

function customerConfirmation(order: Order) {
  const total = formatPrice(order.totals.total);
  const pay = paymentMethod(order.payment).label;
  const address = addressLines(order);
  const track = `${site.url}/order/${order.number}`;

  /* No "!" and no capitals: a transactional subject that reads like a receipt
     is the one that lands in the inbox. */
  const subject = `Order ${order.number} confirmed — ${site.name}`;

  const nextStep =
    order.payment === "bank-transfer"
      ? [
          `Transfer ${total} to ${bankAccount.title}, ${bankAccount.bank} — ${bankAccount.number} (IBAN ${bankAccount.iban}), then send us the receipt on WhatsApp at ${site.whatsapp.display}. We dispatch the same day we see it.`,
        ]
      : [
          `Pay ${total} to the rider when your parcel arrives. Nothing is due before then.`,
        ];

  const text = [
    `Thanks, ${order.customer.firstName || "there"} — we have your order.`,
    "",
    `Order number: ${order.number}`,
    `Arriving:     ${order.eta} (${deliveryMethod(order.delivery).label})`,
    `Payment:      ${pay}`,
    "",
    "WHAT YOU ORDERED",
    itemsText(order),
    "",
    totalsText(order),
    "",
    "DELIVERING TO",
    ...address.map((line) => `  ${line}`),
    `  ${formatPhone(order.customer.phone)}`,
    "",
    "WHAT HAPPENS NEXT",
    ...nextStep.map((line) => `  ${line}`),
    "",
    `Track your order: ${track}`,
    "",
    `Anything to change? Reply to this email, or reach us on WhatsApp at ${site.whatsapp.display}.`,
    "",
    `${site.name} · ${site.email} · ${site.phone}`,
  ].join("\n");

  const html = shell(
    `Order ${order.number} confirmed`,
    `Arriving in ${order.eta}. Your order number is ${order.number}.`,
    `<tr><td style="padding:0 28px 20px;">
  <div style="font-size:22px;font-weight:700;letter-spacing:-0.4px;">Thanks${
    order.customer.firstName ? `, ${esc(order.customer.firstName)}` : ""
  } — we have your order.</div>
  <div style="color:${MUTED};font-size:14px;margin-top:6px;line-height:1.6;">
    We are packing it now. Keep order number <strong style="color:${INK};">${esc(order.number)}</strong>
    handy if you get in touch.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
    <tr><td style="padding-bottom:10px;">${panel("Arriving", [
      order.eta,
      deliveryMethod(order.delivery).label,
    ])}</td></tr>
    <tr><td style="padding-bottom:10px;">${panel("Delivering to", [
      ...address,
      formatPhone(order.customer.phone),
    ])}</td></tr>
    <tr><td>${panel(pay, nextStep)}</td></tr>
  </table>

  <div style="margin-top:22px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">What you ordered</div>
  <div style="margin-top:6px;">${itemsHtml(order)}</div>
  ${totalsHtml(order)}

  <div style="margin-top:22px;">
    <a href="${esc(track)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">View your order</a>
  </div>

  <div style="margin-top:20px;color:${MUTED};font-size:13px;line-height:1.6;">
    Need to change something? Reply to this email, or message us on WhatsApp at ${esc(site.whatsapp.display)}.
  </div>
</td></tr>`,
  );

  return {
    to: order.customer.email,
    subject,
    text,
    html,
    idempotencyKey: `order-${order.number}-confirmation`,
  };
}

/* -------------------------------------------------------------------------- */
/*  Entry point                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Sends the shop's alert and, when the customer left an address, their
 * confirmation. Both over one pooled SMTP session.
 *
 * Resolves rather than throwing — it is called from `after()`, past the point
 * where the order can still fail.
 */
export async function sendOrderEmails(order: Order): Promise<void> {
  if (!mailEnabled) return;

  /* Sequential, not parallel: the pooled transport holds one connection, and
     the shop's copy is the one that must not queue behind the other. */
  await sendMail(shopAlert(order));

  if (isEmailAddress(order.customer.email)) {
    await sendMail(customerConfirmation(order));
  }
}
