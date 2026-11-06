import { NextResponse } from "next/server";
import { currentCustomer } from "@/lib/account/session";
import {
  capiEnabled,
  fbcFromClickId,
  requestContext,
  sendServerEvent,
} from "@/lib/meta-pixel/capi.server";
import type { MetaContent, MetaCustomData } from "@/lib/meta-pixel/payloads";
import { PIXEL_CURRENCY } from "@/lib/meta-pixel/config";

/**
 * Browser events, mirrored to the Conversions API.
 *
 * The pixel posts here with the same `event_id` it gave Meta, so the pair
 * deduplicates and an ad blocker or a Safari that drops the browser event
 * still leaves the server one standing.
 *
 * What this route deliberately will not do:
 *
 * - **Purchase.** A conversion is only ever reported from `/api/orders`, which
 *   has the order the server itself priced and stored. Accepting one here
 *   would let anyone with curl inflate the ad account's reported revenue.
 * - **Trust the payload.** Event name, currency, value, quantities and the
 *   number of lines are all re-checked and clamped below.
 * - **Reveal anything.** The access token lives only in the `server-only`
 *   module this calls, and the response is a bare 204 either way, so the route
 *   cannot be used to probe whether the Conversions API is configured.
 *
 * Off unless `META_CAPI_RELAY=on`. The pixel only calls it when its own
 * `NEXT_PUBLIC_META_CAPI_RELAY` is on too.
 */

const RELAY_ON = process.env.META_CAPI_RELAY === "on";

/** Purchase is absent on purpose — see the note above. */
const ALLOWED = new Set(["ViewContent", "AddToCart", "InitiateCheckout"]);

type AllowedEvent = "ViewContent" | "AddToCart" | "InitiateCheckout";

const MAX_LINES = 50;
/** No single basket is worth more than this; anything above it is noise. */
const MAX_VALUE = 100_000_000;

/* A brake on a script hammering the route, in the spirit of
   `lib/account/throttle.ts`: per process, and not presented as more than that.
   A store behind several instances wants the platform's rate limiter too. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const MAX_KEYS = 5_000;
const hits = new Map<string, { count: number; firstAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    hits.set(key, { count: 1, firstAt: now });
    if (hits.size > MAX_KEYS) {
      for (const [k, v] of hits) {
        if (now - v.firstAt > WINDOW_MS) hits.delete(k);
      }
      // Insertion-ordered, so the first keys are the oldest windows.
      for (const k of hits.keys()) {
        if (hits.size <= MAX_KEYS) break;
        hits.delete(k);
      }
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function text(value: unknown, max = 200): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
}

function money(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(Math.max(Math.round(n * 100) / 100, 0), MAX_VALUE);
}

function count(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 1;
  return Math.min(Math.max(Math.round(n), 1), 999);
}

/** Rebuilds `custom_data` from scratch rather than forwarding what arrived. */
function cleanCustomData(raw: unknown): MetaCustomData | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  const contents: MetaContent[] = Array.isArray(input.contents)
    ? input.contents
        .slice(0, MAX_LINES)
        .map((entry) => {
          const line = (entry ?? {}) as Record<string, unknown>;
          const id = text(line.id, 100);
          return id
            ? {
                id,
                quantity: count(line.quantity),
                item_price: money(line.item_price),
              }
            : null;
        })
        .filter((line): line is MetaContent => line !== null)
    : [];

  if (contents.length === 0) return null;

  return {
    // Never taken from the request: this store sells in one currency.
    currency: PIXEL_CURRENCY,
    value: money(input.value),
    content_type: "product",
    content_ids: contents.map((line) => line.id),
    contents,
    ...(text(input.content_name) ? { content_name: text(input.content_name) } : {}),
    ...(text(input.content_category, 100)
      ? { content_category: text(input.content_category, 100) }
      : {}),
    num_items: contents.reduce((sum, line) => sum + line.quantity, 0),
  };
}

/** Our own domain only, so the event source URL cannot be pointed elsewhere. */
function sameOriginUrl(value: unknown, request: Request): string | undefined {
  const candidate = text(value, 1000);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    const here = new URL(request.url);
    return url.host === here.host ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** A 204 whatever happened: nothing about the configuration leaks from here. */
const done = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  if (!RELAY_ON || !capiEnabled) return done();

  const context = requestContext(request);
  if (rateLimited(context.clientIpAddress ?? "unknown")) return done();

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return done();
  }

  const event = text(payload.event, 40);
  if (!event || !ALLOWED.has(event)) return done();

  const eventId = text(payload.eventId, 100);
  if (!eventId) return done();

  const customData = cleanCustomData(payload.customData);
  if (!customData) return done();

  /* The pixel's own `_fbc` cookie when there is one; otherwise rebuilt from
     the `fbclid` the shopper landed on, which the browser captured before
     navigation dropped it from the URL. Everything else in the body is
     ignored in favour of the request's own headers. */
  const landingClickId = text(
    (payload.attribution as Record<string, unknown> | undefined)?.fbclid,
    200,
  );
  const fbc =
    context.fbc ?? (landingClickId ? fbcFromClickId(landingClickId) : undefined);

  /* A signed-in shopper is matched on their account rather than on cookies
     alone — the strongest signal available without asking the browser to send
     an email address over the wire. */
  const account = await currentCustomer().catch(() => null);

  await sendServerEvent({
    eventName: event as AllowedEvent,
    eventId,
    eventSourceUrl:
      sameOriginUrl(payload.eventSourceUrl, request) ?? context.eventSourceUrl,
    actionSource: "website",
    user: {
      ...(account
        ? {
            email: account.email,
            phone: account.phone,
            firstName: account.firstName,
            lastName: account.lastName,
            externalId: account.id,
            city: account.address?.city,
            province: account.address?.province,
            postalCode: account.address?.postalCode,
          }
        : {}),
      country: "pk",
      fbp: context.fbp,
      fbc,
      clientIpAddress: context.clientIpAddress,
      clientUserAgent: context.clientUserAgent,
    },
    customData,
  });

  return done();
}
