import "server-only";

import { createHash } from "node:crypto";
import { META_PIXEL_ID, PIXEL_CURRENCY, pixelEnabled } from "./config";
import { purchaseData, purchaseEventId, type MetaCustomData } from "./payloads";
import type { CustomerDetails, Order } from "@/lib/types";

/**
 * Meta Conversions API — the server half of every event.
 *
 * `server-only` and read-only on the environment: the access token is a
 * credential that can write to the ad account's event stream, so it is never
 * prefixed `NEXT_PUBLIC_`, never returned from a route and never logged. If
 * the token is absent every function here is a no-op, which is what keeps a
 * deployment without one working exactly as before.
 *
 * Browser/server deduplication: both sides send the same `event_name` and
 * `event_id` for one action, and Meta keeps a single event. For Purchase the
 * pair agrees without any plumbing because the ID is derived from the order
 * number — see `purchaseEventId`.
 */

const TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN ?? "";
/** Overridable so a Graph API deprecation needs an env change, not a deploy. */
const VERSION = process.env.META_CONVERSIONS_API_VERSION || "v23.0";
/** Set while testing to make events show up under Events Manager → Test events. */
const TEST_EVENT_CODE = process.env.META_CONVERSIONS_API_TEST_EVENT_CODE || "";

/** True when a server event can actually be sent. */
export const capiEnabled = pixelEnabled && TOKEN.length > 0;

/* -------------------------------------------------------------------------- */
/*  Hashing                                                                   */
/* -------------------------------------------------------------------------- */

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Meta wants customer information lower-cased, trimmed and then SHA-256'd. */
function hash(value: string | undefined | null): string | undefined {
  const normalised = (value ?? "").trim().toLowerCase();
  return normalised ? sha256(normalised) : undefined;
}

/**
 * E.164 without the `+`, which is the only form Meta matches phone numbers on.
 * Pakistani numbers are typed as `0300…` far more often than `+92300…`, so a
 * local number is promoted to the country code before hashing.
 */
function hashPhone(value: string | undefined): string | undefined {
  let digits = (value ?? "").replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  else if (digits.length === 10) digits = `92${digits}`;
  return sha256(digits);
}

export interface ServerUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  /** Two-letter ISO country, unhashed on the way in. */
  country?: string;
  /** Our own stable ID for the shopper — an account ID, hashed. */
  externalId?: string;
  /** From the pixel's own first-party cookies. */
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

/** Builds Meta's `user_data`, hashing everything that must be hashed. */
function userData(input: ServerUserData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const em = hash(input.email);
  const ph = hashPhone(input.phone);
  const fn = hash(input.firstName);
  const ln = hash(input.lastName);
  const ct = hash(input.city?.replace(/\s+/g, ""));
  const st = hash(input.province);
  const zp = hash(input.postalCode);
  const country = hash(input.country ?? "pk");
  const externalId = hash(input.externalId);

  if (em) out.em = [em];
  if (ph) out.ph = [ph];
  if (fn) out.fn = [fn];
  if (ln) out.ln = [ln];
  if (ct) out.ct = [ct];
  if (st) out.st = [st];
  if (zp) out.zp = [zp];
  if (country) out.country = [country];
  if (externalId) out.external_id = [externalId];

  // Never hashed: these are Meta's own identifiers and the request metadata.
  if (input.fbp) out.fbp = input.fbp;
  if (input.fbc) out.fbc = input.fbc;
  if (input.clientIpAddress) out.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) out.client_user_agent = input.clientUserAgent;

  return out;
}

/* -------------------------------------------------------------------------- */
/*  Sending                                                                   */
/* -------------------------------------------------------------------------- */

export interface ServerEvent {
  eventName: "Purchase" | "ViewContent" | "AddToCart" | "InitiateCheckout";
  /** Must match the browser event's `eventID` for the pair to deduplicate. */
  eventId: string;
  /** Seconds since the epoch. Meta rejects events older than seven days. */
  eventTime?: number;
  eventSourceUrl?: string;
  /** `website` for a browser-initiated action, `other` for a server-side one. */
  actionSource?: "website" | "other";
  user: ServerUserData;
  customData: MetaCustomData;
}

export type CapiResult =
  | { ok: true }
  | { ok: false; reason: "disabled" | "failed" };

/**
 * Posts one event. Resolves rather than throwing on failure: no caller of this
 * is allowed to fail a shopper's request because Meta was unreachable.
 */
export async function sendServerEvent(event: ServerEvent): Promise<CapiResult> {
  if (!capiEnabled) return { ok: false, reason: "disabled" };

  const body = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: event.actionSource ?? "website",
        ...(event.eventSourceUrl
          ? { event_source_url: event.eventSourceUrl }
          : {}),
        user_data: userData(event.user),
        // The builders in `payloads.ts` already set the currency; this is
        // the floor under a payload that somehow arrived without one.
        custom_data: { ...event.customData, currency: PIXEL_CURRENCY },
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${VERSION}/${META_PIXEL_ID}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Header rather than a query parameter, so the token cannot end up
          // in an access log or a proxy's URL trace.
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      /* The status and Meta's own message, never the request body: it carries
         hashed customer data, and never the token. */
      const detail = await response.text().catch(() => "");
      console.error(
        "Meta CAPI rejected",
        event.eventName,
        response.status,
        detail.slice(0, 500),
      );
      return { ok: false, reason: "failed" };
    }
    return { ok: true };
  } catch (cause) {
    console.error("Meta CAPI unreachable", event.eventName, cause);
    return { ok: false, reason: "failed" };
  }
}

/* -------------------------------------------------------------------------- */
/*  Request context                                                           */
/* -------------------------------------------------------------------------- */

export interface RequestContext {
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  eventSourceUrl?: string;
}

/**
 * The `_fbc` value Meta would have cookied, rebuilt from a click ID.
 *
 * A browser that refuses first-party cookies — or one that landed before the
 * pixel script had run — has an `fbclid` in the URL and no `_fbc`. Meta
 * documents this exact reconstruction, and it is the difference between a
 * server event that attributes to the ad and one that does not.
 */
export function fbcFromClickId(
  fbclid: string,
  clickedAt = Date.now(),
): string {
  return `fb.1.${clickedAt}.${fbclid}`;
}

/** Pulls the pixel cookies, the real client IP and the UA off a request. */
export function requestContext(request: Request): RequestContext {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = (name: string) => {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : undefined;
  };

  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip =
    forwarded.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  return {
    fbp: cookie("_fbp"),
    fbc: cookie("_fbc"),
    clientIpAddress: ip,
    clientUserAgent: request.headers.get("user-agent") ?? undefined,
    eventSourceUrl: request.headers.get("referer") ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*  Purchase                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The server-side Purchase, sent only once an order has been stored.
 *
 * Prices come from the order the server built by re-pricing the basket against
 * the catalogue, so this value cannot be influenced from the browser.
 */
export async function sendPurchaseEvent(
  order: Order,
  options: RequestContext & { accountId?: string | null } = {},
): Promise<CapiResult> {
  if (!capiEnabled) return { ok: false, reason: "disabled" };

  const customer: CustomerDetails = order.customer;

  return sendServerEvent({
    eventName: "Purchase",
    eventId: purchaseEventId(order.number),
    eventTime: Math.floor(new Date(order.placedAt).getTime() / 1000),
    eventSourceUrl: options.eventSourceUrl,
    actionSource: "website",
    user: {
      email: customer.email,
      phone: customer.phone,
      firstName: customer.firstName,
      lastName: customer.lastName,
      city: customer.city,
      province: customer.province,
      postalCode: customer.postalCode,
      country: "pk",
      ...(options.accountId ? { externalId: options.accountId } : {}),
      fbp: options.fbp,
      fbc: options.fbc,
      clientIpAddress: options.clientIpAddress,
      clientUserAgent: options.clientUserAgent,
    },
    customData: purchaseData(order),
  });
}
