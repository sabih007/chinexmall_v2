import "server-only";

import { createSign } from "node:crypto";

/**
 * Firebase Cloud Messaging, HTTP v1.
 *
 * `server-only`. The service account private key can send a notification to
 * every device subscribed to your app, so it is never prefixed `NEXT_PUBLIC_`,
 * never returned from a route and never logged.
 *
 * v1 rather than the old `Authorization: key=…` endpoint: the legacy API was
 * shut down in 2024. v1 wants a short-lived OAuth2 access token, minted here
 * by signing a JWT with the service account key — which is why there is no
 * `firebase-admin` dependency. Node's own crypto is enough, and this route
 * runs in an edge-adjacent runtime where the Admin SDK is awkward.
 *
 * Messages go to a **topic**, not to device tokens. Every phone that should
 * hear about an order subscribes to the same topic in the app, so adding a
 * staff member is an action in the app rather than a database row here, and
 * there are no stale tokens to prune.
 */

const PROJECT_ID = process.env.FCM_PROJECT_ID ?? "";
const CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL ?? "";
/* Env stores are single-line, so a PEM arrives with literal backslash-n. */
const PRIVATE_KEY = (process.env.FCM_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

/** True when a notification can actually be sent. */
export const fcmEnabled =
  PROJECT_ID.length > 0 && CLIENT_EMAIL.length > 0 && PRIVATE_KEY.length > 0;

/* -------------------------------------------------------------------------- */
/*  Access token                                                              */
/* -------------------------------------------------------------------------- */

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** A Google service-account assertion, good for one hour. */
function signedAssertion(now: number): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: CLIENT_EMAIL,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const body = `${header}.${claim}`;
  const signature = createSign("RSA-SHA256")
    .update(body)
    .sign(PRIVATE_KEY);
  return `${body}.${base64url(signature)}`;
}

/* One token per process, reused until it is nearly expired. Each serverless
   instance mints its own, which is cheap and avoids any shared state. */
let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  // Sixty seconds of slack, so a token never expires mid-flight.
  if (cached && cached.expiresAt - 60 > now) return cached.token;

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedAssertion(now),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      /* Status and Google's message only — the assertion carries the key. */
      const detail = await response.text().catch(() => "");
      console.error("FCM auth failed", response.status, detail.slice(0, 300));
      return null;
    }

    const body = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!body.access_token) return null;

    cached = {
      token: body.access_token,
      expiresAt: now + (body.expires_in ?? 3600),
    };
    return cached.token;
  } catch (cause) {
    console.error("FCM auth unreachable", cause);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Sending                                                                   */
/* -------------------------------------------------------------------------- */

export interface TopicMessage {
  /** Topic name, without the `/topics/` prefix. */
  topic: string;
  title: string;
  body: string;
  /** Extra values for the app to read when the notification is tapped. */
  data?: Record<string, string>;
  /** Android channel the app created. Decides sound and how loudly it lands. */
  channelId?: string;
  /** Groups repeats of the same thing — a re-send replaces, not stacks. */
  collapseKey?: string;
}

export type SendResult =
  | { ok: true }
  | { ok: false; reason: "disabled" | "unauthorised" | "failed" };

/**
 * Sends one notification to a topic.
 *
 * Resolves rather than throwing: nothing that calls this may fail a shopper's
 * request because Firebase was unreachable.
 */
export async function sendToTopic(message: TopicMessage): Promise<SendResult> {
  if (!fcmEnabled) return { ok: false, reason: "disabled" };

  const token = await accessToken();
  if (!token) return { ok: false, reason: "unauthorised" };

  /* `notification` so Android shows it even when the app is killed, `data`
     so the app can act on a tap, and the android block to make it arrive at
     once and loudly rather than being held back by battery optimisation. */
  const payload = {
    message: {
      topic: message.topic,
      notification: { title: message.title, body: message.body },
      ...(message.data ? { data: message.data } : {}),
      android: {
        priority: "HIGH" as const,
        ...(message.collapseKey ? { collapse_key: message.collapseKey } : {}),
        notification: {
          channel_id: message.channelId ?? "orders",
          notification_priority: "PRIORITY_MAX" as const,
          default_sound: true,
          default_vibrate_timings: false,
          /* Three sharp bursts — unmistakable in a pocket. */
          vibrate_timings: ["0s", "0.4s", "0.2s", "0.4s", "0.2s", "0.4s"],
          ...(message.collapseKey ? { tag: message.collapseKey } : {}),
        },
      },
    },
  };

  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      // A rejected token is usually one that expired early; drop the cache so
      // the next send mints a fresh one instead of failing the same way.
      if (response.status === 401) cached = null;
      const detail = await response.text().catch(() => "");
      console.error("FCM rejected", response.status, detail.slice(0, 300));
      return { ok: false, reason: "failed" };
    }
    return { ok: true };
  } catch (cause) {
    console.error("FCM unreachable", cause);
    return { ok: false, reason: "failed" };
  }
}
