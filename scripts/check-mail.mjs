/**
 * Checks the SMTP credentials in .env.local, then optionally sends a test
 * message to the order-alert address.
 *
 *   npm run mail:check          -- connect and authenticate only
 *   npm run mail:check -- send  -- also send a real test email
 *
 * Deliberately standalone: it talks to nodemailer directly rather than going
 * through src/lib/notify, so a failure here is unambiguously the mailbox or
 * the network and never the app.
 */

import { readFileSync } from "node:fs";
import nodemailer from "nodemailer";

/* ---- read .env.local, without pulling in a dotenv dependency ---- */

function loadEnv(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    console.error(`No ${file}. Copy .env.example and fill in the SMTP values.`);
    process.exit(1);
  }

  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    /* Only strip quotes when they wrap the whole value — a password may
       legitimately contain one. */
    if (value.length > 1 && /^(".*"|'.*')$/s.test(value)) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnv(".env.local");

const host = env.SMTP_HOST ?? "";
const port = Number(env.SMTP_PORT ?? 465);
const user = env.SMTP_USER ?? "";
const pass = env.SMTP_PASSWORD ?? "";

const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"].filter(
  (key) => !env[key],
);
if (missing.length > 0) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const to = env.ORDER_ALERT_EMAIL || user;

/* Mirrors src/lib/notify/mailer.server.ts, so a pass here means a pass
   there. */
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  requireTLS: true,
  auth: { user, pass },
  connectionTimeout: 15_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

console.log(`Connecting to ${host}:${port} as ${user} …`);

try {
  await transporter.verify();
  console.log("OK — connected, TLS negotiated and credentials accepted.");
} catch (cause) {
  console.error(`FAILED — ${cause.message}`);
  /* The three things that actually go wrong, in the order they go wrong. */
  if (/auth/i.test(cause.message)) {
    console.error(
      "\nThe mailbox rejected the password. Check it in hPanel -> Emails ->" +
        "\nyour domain -> Email Accounts, and confirm SMTP_USER is the full" +
        "\naddress rather than just the part before the @.",
    );
  } else if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(cause.message)) {
    console.error(
      `\nNothing answered on port ${port}. Try SMTP_PORT=587, which uses` +
        "\nSTARTTLS instead of implicit TLS — some networks block 465.",
    );
  } else if (/ENOTFOUND|EAI_AGAIN/i.test(cause.message)) {
    console.error(
      `\n${host} did not resolve. Hostinger Email is smtp.hostinger.com;` +
        "\nTitan Mail is smtp.titan.email.",
    );
  }
  process.exit(1);
}

if (!process.argv.slice(2).includes("send")) {
  console.log("\nRun `npm run mail:check -- send` to also send a test email.");
  process.exit(0);
}

console.log(`Sending a test message to ${to} …`);

const stamp = new Date().toISOString();
await transporter.sendMail({
  from: `"${env.MAIL_FROM_NAME || "ChineXmall"}" <${user}>`,
  to,
  subject: `SMTP check ${stamp}`,
  text:
    `This is the ChineXmall order-email check.\n\n` +
    `Host: ${host}:${port}\nFrom: ${user}\nSent: ${stamp}\n\n` +
    `If this is in your inbox rather than spam, order emails will be too.\n`,
  html:
    `<p>This is the ChineXmall order-email check.</p>` +
    `<p>Host: ${host}:${port}<br>From: ${user}<br>Sent: ${stamp}</p>` +
    `<p>If this is in your inbox rather than spam, order emails will be too.</p>`,
  envelope: { from: user, to },
  headers: {
    "Auto-Submitted": "auto-generated",
    "X-Auto-Response-Suppress": "All",
  },
});

console.log(
  `Sent. Check ${to} — and check the spam folder too, so you know which` +
    `\nfolder it landed in before a real order depends on it.`,
);
process.exit(0);
