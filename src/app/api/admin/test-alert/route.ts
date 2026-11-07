import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { fcmEnabled, sendToTopic } from "@/lib/notify/fcm.server";

/**
 * Fires a test notification to the order topic.
 *
 * Setting up push is a loop — subscribe the phone, send, check the lock
 * screen, adjust the channel, send again — and doing that loop by placing real
 * orders would leave a trail of fake orders in the dashboard and fake
 * conversions in Events Manager. This sends the alert and nothing else.
 *
 * Admin-only, and it reveals nothing to anyone else: a signed-out caller gets
 * the same 404 they would get for a route that does not exist, so its presence
 * cannot be probed.
 */

const TOPIC = process.env.ORDER_ALERT_TOPIC || "orders";

/** What a stranger sees — indistinguishable from a missing route. */
const notFound = () =>
  new NextResponse(null, { status: 404, statusText: "Not Found" });

export async function POST() {
  if (!(await isAdminAuthenticated())) return notFound();

  if (!fcmEnabled) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Push is not configured. Set FCM_PROJECT_ID, FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY, then redeploy.",
      },
      { status: 503 },
    );
  }

  const stamp = new Date().toISOString();
  const result = await sendToTopic({
    topic: TOPIC,
    title: "Test alert · ChineXmall",
    body: "Push is working. A real order will look like this.\nRs. 3,248 · Lahore · Cash on delivery",
    data: { type: "test", sentAt: stamp, url: "/admin/orders" },
    channelId: "orders",
    /* Timestamped, so repeated tests during setup each land separately
       instead of replacing one another. */
    collapseKey: `test-${stamp}`,
  });

  return NextResponse.json(
    result.ok
      ? { ok: true, topic: TOPIC, sentAt: stamp }
      : { ok: false, reason: result.reason },
    { status: result.ok ? 200 : 502 },
  );
}
