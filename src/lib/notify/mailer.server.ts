import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { site } from "@/lib/site";

/**
 * Outbound email over your own mailbox's SMTP.
 *
 * `server-only`. The SMTP password can send mail as your domain, so it is
 * never prefixed `NEXT_PUBLIC_`, never returned from a route and never logged.
 *
 * Why your own mailbox rather than a sending API: everything this sends is
 * transactional and at least one copy goes to an address *on the same domain
 * that authenticates the submission*. A mail server accepting authenticated
 * submission for its own domain delivers locally — no reputation check, no
 * greylisting, no spam folder. The customer's copy then leaves with SPF and
 * DKIM already aligned, because the envelope sender, the `From` header and
 * the authenticating account are all the same address (see `FROM` below).
 *
 * Unlike the FCM client next door this leans on a dependency: SMTP is a
 * stateful TCP conversation with STARTTLS, AUTH mechanisms and dot-stuffing,
 * and a hand-rolled one is a liability rather than a saving.
 */

const HOST = process.env.SMTP_HOST ?? "";
const PORT = Number(process.env.SMTP_PORT ?? 465);
const USER = process.env.SMTP_USER ?? "";
const PASSWORD = process.env.SMTP_PASSWORD ?? "";

/** True when mail can actually be sent. */
export const mailEnabled =
  HOST.length > 0 && USER.length > 0 && PASSWORD.length > 0;

/**
 * The authenticating mailbox is the sender, always.
 *
 * A `From` that does not match the account that authenticated is the single
 * biggest reason transactional mail is filed as spam — it fails DMARC
 * alignment even when SPF and DKIM both pass. So the address is taken from
 * `SMTP_USER` and `MAIL_FROM_NAME` only supplies the display name.
 */
const FROM_NAME = process.env.MAIL_FROM_NAME ?? site.name;
const FROM = `"${FROM_NAME}" <${USER}>`;

/** Where the shop's own "new order" alert lands. */
export const alertRecipient = process.env.ORDER_ALERT_EMAIL || site.email;

/** Domain for `Message-ID`, which some filters check against the sender. */
const MESSAGE_ID_DOMAIN = USER.split("@")[1] ?? "localhost";

/* Port 465 is implicit TLS; 587 starts in the clear and upgrades. Either way
   `requireTLS` means the password never crosses an unencrypted socket: a
   server that will not upgrade gets no credentials. */
let transporter: Transporter | null = null;

function transport(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    requireTLS: true,
    auth: { user: USER, pass: PASSWORD },
    /* Shared hosting is slow to answer and the caller is already off the
       request's critical path, so these are generous rather than snappy. */
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    /* One connection, several messages: the admin alert and the customer's
       confirmation go out over the same session instead of logging in twice. */
    pool: true,
    maxConnections: 1,
    maxMessages: 10,
  });
  return transporter;
}

export interface Mail {
  to: string;
  subject: string;
  /** Plain-text part. Never omit it — HTML-only mail scores as spam. */
  text: string;
  html: string;
  /** Where a human reply should go, when that is not the shop itself. */
  replyTo?: string;
  /**
   * Stable per-message identity, e.g. `order-CX-7K3QD2-alert`. Re-sending the
   * same id lets a mail client recognise the duplicate instead of showing the
   * customer two confirmations for one order.
   */
  idempotencyKey?: string;
}

export type MailResult =
  | { ok: true }
  | { ok: false; reason: "disabled" | "no-recipient" | "failed" };

/**
 * Sends one message.
 *
 * Resolves rather than throwing: nothing that calls this may fail a shopper's
 * order because a mail server was unreachable.
 */
export async function sendMail(mail: Mail): Promise<MailResult> {
  if (!mailEnabled) return { ok: false, reason: "disabled" };
  if (!mail.to) return { ok: false, reason: "no-recipient" };

  try {
    await transport().sendMail({
      from: FROM,
      to: mail.to,
      subject: mail.subject,
      /* Both parts, as multipart/alternative. */
      text: mail.text,
      html: mail.html,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
      ...(mail.idempotencyKey
        ? { messageId: `<${mail.idempotencyKey}@${MESSAGE_ID_DOMAIN}>` }
        : {}),
      /* The envelope sender must match `From` or SPF is checked against the
         wrong domain and the message is treated as forwarded spam. */
      envelope: { from: USER, to: mail.to },
      headers: {
        /* Marks the mail as automatic and transactional. Keeps it out of
           bulk/promotions buckets and stops it triggering auto-replies or
           out-of-office loops. */
        "Auto-Submitted": "auto-generated",
        "X-Auto-Response-Suppress": "All",
      },
    });
    return { ok: true };
  } catch (cause) {
    /* The message, not the transport config — that holds the password. */
    console.error(
      "SMTP send failed",
      mail.subject,
      cause instanceof Error ? cause.message : cause,
    );
    return { ok: false, reason: "failed" };
  }
}
