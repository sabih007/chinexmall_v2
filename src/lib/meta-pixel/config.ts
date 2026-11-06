/**
 * Meta Pixel configuration — the client-safe half.
 *
 * Everything here is read on both sides of the wire, so nothing secret may
 * live in this file. The Conversions API access token is read only by
 * `capi.server.ts`, which is `server-only`.
 */

import { site } from "@/lib/site";

/**
 * Pixel ID, from the base code Meta gives you in Events Manager.
 *
 * Narrowed to digits because it is interpolated into the inline base code: a
 * fat-fingered environment variable must not be able to become script.
 */
export const META_PIXEL_ID = (
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ""
).replace(/[^0-9]/g, "");

/** Nothing loads and nothing is tracked until the ID is configured. */
export const pixelEnabled = META_PIXEL_ID.length > 0;

/** Every value Meta receives is in this currency. */
export const PIXEL_CURRENCY = site.currency.code;

/**
 * `required` holds every event back until consent is granted —
 * `fbq('consent', 'revoke')` on init, queued by the pixel itself, flushed on
 * grant. `granted` (the default) is the behaviour of the base code as Meta
 * ships it, which is what a Pakistan-only storefront with no cookie banner
 * wants. Flip the variable, not the components, if a banner arrives.
 */
export const consentRequired =
  process.env.NEXT_PUBLIC_META_PIXEL_CONSENT_MODE === "required";

/**
 * Mirrors browser events to the Conversions API through `/api/meta/events`,
 * sharing the browser's `event_id` so Meta deduplicates the pair.
 *
 * Off by default: Purchase already goes server-side from the order route,
 * which is the event that matters and the only one the browser is never
 * trusted for.
 */
export const relayEnabled = process.env.NEXT_PUBLIC_META_CAPI_RELAY === "on";

/** Logs every event to the console instead of guessing in Events Manager. */
export const pixelDebug = process.env.NEXT_PUBLIC_META_PIXEL_DEBUG === "on";
