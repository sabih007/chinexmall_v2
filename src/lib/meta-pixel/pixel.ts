/**
 * The browser side of the Meta Pixel: consent, event IDs, deduplication and
 * the four commerce events.
 *
 * Every function is safe to call before the pixel script has finished loading
 * and safe to call when the pixel is switched off — `fbq` queues calls itself,
 * and an unconfigured `NEXT_PUBLIC_META_PIXEL_ID` makes all of this a no-op.
 * Nothing here throws, because an analytics failure must never take a cart or
 * a checkout down with it.
 */

import {
  META_PIXEL_ID,
  consentRequired,
  pixelDebug,
  pixelEnabled,
  relayEnabled,
} from "./config";
import { attribution, browserIdentifiers } from "./attribution";
import {
  addToCartData,
  basketData,
  purchaseData,
  purchaseEventId,
  viewContentData,
  type MetaCustomData,
  type ProductSummary,
} from "./payloads";
import type { CartLine, Order } from "@/lib/types";

type FbqFunction = {
  (...args: unknown[]): void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  callMethod?: (...args: unknown[]) => void;
  push?: unknown;
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    /** Hook for a consent banner, if one is ever added. See `consentRequired`. */
    chinexmallPixelConsent?: {
      grant: () => void;
      revoke: () => void;
      state: () => ConsentState;
    };
  }
}

export type ConsentState = "granted" | "denied" | "unknown";

const CONSENT_KEY = "cx.meta.consent.v1";
/** Events already reported, so a remount cannot double-count. */
const SENT_KEY = "cx.meta.sent.v1";

const sentThisPage = new Set<string>();

function log(...args: unknown[]): void {
  if (pixelDebug) console.log("[meta-pixel]", ...args);
}

/* -------------------------------------------------------------------------- */
/*  Consent                                                                   */
/* -------------------------------------------------------------------------- */

export function consentState(): ConsentState {
  if (!consentRequired) return "granted";
  if (typeof window === "undefined") return "unknown";
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "granted" || stored === "denied") return stored;
  } catch {
    /* unreadable storage — treat as undecided, which withholds events */
  }
  return "unknown";
}

/** True once events may actually reach Meta. */
export function trackingAllowed(): boolean {
  return pixelEnabled && consentState() === "granted";
}

function setConsent(next: "granted" | "denied"): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, next);
  } catch {
    /* the choice still holds for this page */
  }
  // "grant" flushes whatever the pixel queued while consent was withheld.
  window.fbq?.("consent", next === "granted" ? "grant" : "revoke");
  log("consent", next);
}

export function grantMetaPixelConsent(): void {
  if (typeof window !== "undefined") setConsent("granted");
}

export function revokeMetaPixelConsent(): void {
  if (typeof window !== "undefined") setConsent("denied");
}

/* -------------------------------------------------------------------------- */
/*  Event identity and deduplication                                         */
/* -------------------------------------------------------------------------- */

/** A random ID the server can be handed so Meta collapses the pair. */
export function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the time-and-random form below */
  }
  return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * True the first time a key is seen, false afterwards.
 *
 * In-memory for the page, and in sessionStorage for anything that has to
 * survive a reload — a Purchase above all, which the confirmation page would
 * otherwise re-report on every refresh and every back-navigation.
 */
function claim(key: string, durable: boolean): boolean {
  if (sentThisPage.has(key)) return false;
  sentThisPage.add(key);
  if (!durable) return true;

  try {
    const raw = window.sessionStorage.getItem(SENT_KEY);
    const seen = raw ? (JSON.parse(raw) as string[]) : [];
    if (seen.includes(key)) return false;
    // Bounded: a long session must not grow this without limit.
    window.sessionStorage.setItem(
      SENT_KEY,
      JSON.stringify([...seen.slice(-49), key]),
    );
  } catch {
    /* no durable store — the in-memory guard still covers this page */
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Reporting                                                                */
/* -------------------------------------------------------------------------- */

interface TrackOptions {
  /** Shared with the server event, where there is one. */
  eventId?: string;
  /** Deduplication key. Defaults to the event name plus its ID. */
  dedupeKey?: string;
  /** Survive a reload — for events that must fire exactly once, ever. */
  durable?: boolean;
  /** Mirror to the Conversions API through /api/meta/events. */
  relay?: boolean;
}

function track(
  event: string,
  data: MetaCustomData | undefined,
  options: TrackOptions = {},
): void {
  if (typeof window === "undefined" || !pixelEnabled) return;

  const eventId = options.eventId ?? newEventId();
  const key = options.dedupeKey ?? `${event}:${eventId}`;
  if (!claim(key, options.durable ?? false)) {
    log("skipped duplicate", event, key);
    return;
  }

  // Queued by fbq and sent on grant while consent is withheld, sent at once
  // otherwise. Either way the call is made exactly once.
  window.fbq?.("track", event, data, { eventID: eventId });
  log("track", event, { eventId, ...data });

  if (options.relay && relayEnabled && trackingAllowed()) {
    void relay(event, data, eventId);
  }
}

/** Fire-and-forget mirror of a browser event to our own server. */
async function relay(
  event: string,
  data: MetaCustomData | undefined,
  eventId: string,
): Promise<void> {
  try {
    await fetch("/api/meta/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event,
        eventId,
        customData: data,
        eventSourceUrl: window.location.href,
        attribution: attribution().params,
        ...browserIdentifiers(),
      }),
    });
  } catch {
    /* the browser event already landed; the mirror is best effort */
  }
}

/** The first load's PageView lives in the base code; this is every one after. */
export function trackPageView(url: string): void {
  if (typeof window === "undefined" || !pixelEnabled) return;
  window.fbq?.("track", "PageView");
  log("PageView", url);
}

export function trackViewContent(
  product: ProductSummary,
  unitPrice?: number,
): void {
  // One per page visit. Not deduplicated across the session: coming back to a
  // product later is a second genuine view, and the component that calls this
  // guards against a double-fire within a single mount.
  track("ViewContent", viewContentData(product, unitPrice), { relay: true });
}

export function trackAddToCart(
  line: Pick<CartLine, "productId" | "name" | "quantity" | "unitPrice">,
  category?: string,
): void {
  // Deliberately not deduplicated by product: adding the same item twice is
  // two genuine intents to buy.
  track("AddToCart", addToCartData(line, category), { relay: true });
}

export function trackInitiateCheckout(
  lines: Pick<CartLine, "productId" | "quantity" | "unitPrice">[],
): void {
  if (lines.length === 0) return;
  // Once per visit to the checkout, for the same reason as ViewContent.
  track("InitiateCheckout", basketData(lines), { relay: true });
}

/**
 * A completed order.
 *
 * Only ever called with an order the server has already created and stored —
 * the confirmation page either read it back from the shopper's account or
 * holds the copy its own successful checkout saved. The event ID is derived
 * from the order number, which deduplicates it against the server-side
 * Purchase and makes a refresh of the page a no-op.
 */
export function trackPurchase(
  order: Pick<Order, "number" | "lines" | "totals">,
): void {
  if (!order?.number || order.lines.length === 0) return;
  track("Purchase", purchaseData(order), {
    eventId: purchaseEventId(order.number),
    dedupeKey: `Purchase:${order.number}`,
    durable: true,
    // Never relayed from the browser: /api/orders sends the server-side
    // Purchase itself, from prices it re-derived from the catalogue.
    relay: false,
  });
}

/* -------------------------------------------------------------------------- */
/*  Base code                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The inline half of Meta's base code, exactly as Events Manager gives it,
 * with the pixel ID taken from the environment and the consent call folded in.
 *
 * It stays an inline script rather than becoming imperative code so that the
 * `fbq` stub exists — and starts queueing — before `fbevents.js` has loaded,
 * which is the whole point of how Meta ships it.
 */
export function baseCode(): string {
  return [
    "!function(f,b,e,v,n,t,s)",
    "{if(f.fbq)return;n=f.fbq=function(){n.callMethod?",
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};",
    "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';",
    "n.queue=[];t=b.createElement(e);t.async=!0;",
    "t.src=v;s=b.getElementsByTagName(e)[0];",
    "s.parentNode.insertBefore(t,s)}(window, document,'script',",
    "'https://connect.facebook.net/en_US/fbevents.js');",
    ...(consentRequired ? ["fbq('consent', 'revoke');"] : []),
    `fbq('init', '${META_PIXEL_ID}');`,
    "fbq('track', 'PageView');",
  ].join("\n");
}
