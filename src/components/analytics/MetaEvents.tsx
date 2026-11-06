"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import {
  trackInitiateCheckout,
  trackPurchase,
  trackViewContent,
} from "@/lib/meta-pixel/pixel";
import type { ProductSummary } from "@/lib/meta-pixel/payloads";
import type { Order } from "@/lib/types";

/**
 * The three events that belong to a page rather than to a click.
 *
 * Each renders nothing and is mounted alongside the page it reports, so no
 * existing component had to take on an analytics concern. AddToCart is the
 * exception: it belongs to an action, and is reported from the one place in
 * the store where a cart line is actually added.
 *
 * The refs are what make each event fire once per visit — React runs an effect
 * twice in development's strict mode, and a parent re-render must not count as
 * a second view.
 */

/** ViewContent, once per product page. */
export function TrackViewContent({ product }: { product: ProductSummary }) {
  const reported = useRef<string | null>(null);

  useEffect(() => {
    if (reported.current === product.id) return;
    reported.current = product.id;
    trackViewContent(product);
  }, [product]);

  return null;
}

/**
 * InitiateCheckout, once the checkout has a basket to report.
 *
 * Waits for `hydrated` because the cart lives in localStorage: before that the
 * basket legitimately looks empty, and an event fired then would say nothing.
 */
export function TrackInitiateCheckout() {
  const { lines, hydrated } = useStore();
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current || !hydrated || lines.length === 0) return;
    reported.current = true;
    trackInitiateCheckout(lines);
  }, [hydrated, lines]);

  return null;
}

/**
 * Purchase, once per order, and only for an order that exists.
 *
 * `order` is non-null only when the server has confirmed and stored it — read
 * back from the shopper's account, or the copy their own successful checkout
 * saved after `/api/orders` returned it. The event ID is derived from the
 * order number, so a refresh, a back-navigation and the server-side Purchase
 * all collapse into the one conversion.
 */
export function TrackPurchase({ order }: { order: Order | null }) {
  useEffect(() => {
    if (!order) return;
    trackPurchase(order);
  }, [order]);

  return null;
}
