import "server-only";

import { formatPrice } from "@/lib/format";
import { paymentMethod } from "@/lib/orders";
import { sendToTopic, fcmEnabled } from "./fcm.server";
import type { Order } from "@/lib/types";

/**
 * "New order" alert to the shop's phones.
 *
 * Every phone that should hear about an order subscribes to one topic in the
 * app, so this sends once no matter how many people are on the rota.
 *
 * Deliberately short: a notification is read on a lock screen at a glance. The
 * number, the money and where it is going — everything else is one tap away in
 * the dashboard, which is what `data.url` opens.
 */

const TOPIC = process.env.ORDER_ALERT_TOPIC || "orders";

/** Collapses to a count once a line would be too long to read at a glance. */
function itemSummary(order: Order): string {
  const units = order.lines.reduce((n, l) => n + l.quantity, 0);
  const first = order.lines[0];
  if (!first) return "No items";
  if (order.lines.length === 1) {
    return first.quantity > 1 ? `${first.name} ×${first.quantity}` : first.name;
  }
  return `${first.name} +${order.lines.length - 1} more · ${units} items`;
}

export async function sendNewOrderAlert(order: Order): Promise<void> {
  if (!fcmEnabled) return;

  const total = formatPrice(order.totals.total);
  const payment = paymentMethod(order.payment).label;
  const who = `${order.customer.firstName} ${order.customer.lastName}`.trim();

  await sendToTopic({
    topic: TOPIC,
    title: `New order ${order.number} · ${total}`,
    body: [
      itemSummary(order),
      `${who || "Guest"} · ${order.customer.city}`,
      payment,
    ].join("\n"),
    data: {
      type: "new_order",
      orderNumber: order.number,
      total: String(order.totals.total),
      currency: "PKR",
      itemCount: String(order.lines.reduce((n, l) => n + l.quantity, 0)),
      phone: order.customer.phone,
      city: order.customer.city,
      payment: order.payment,
      /* Where a tap should land. The dashboard already has this page. */
      url: `/admin/orders/${order.number}`,
    },
    channelId: "orders",
    /* One alert per order: a retry replaces the notification rather than
       stacking a second copy of the same order on the lock screen. */
    collapseKey: order.number,
  });
}
