/**
 * The `custom_data` Meta receives, built from the store's own domain types.
 *
 * Shared by the browser pixel and the server-side Conversions API on purpose:
 * a deduplicated pair of events has to describe the same purchase, or Meta
 * keeps whichever of the two carries the thinner payload.
 *
 * `content_id` is always `Product.id` — the same id the cart, the order and
 * `/api/orders` use. A Meta product catalogue uploaded for dynamic ads has to
 * be keyed on that id for its items to match these events.
 */

import { PIXEL_CURRENCY } from "./config";
import type { CartLine, Order, OrderLine, Product } from "@/lib/types";

export interface MetaContent {
  id: string;
  quantity: number;
  item_price: number;
}

export interface MetaCustomData {
  currency: string;
  value: number;
  content_type: "product";
  content_ids: string[];
  contents: MetaContent[];
  content_name?: string;
  content_category?: string;
  num_items?: number;
  order_id?: string;
}

/** Rupees as a number Meta will accept — never a formatted string. */
function money(value: number): number {
  return Math.round(Math.max(value, 0) * 100) / 100;
}

/** Everything an event needs to know about a product. */
export type ProductSummary = Pick<
  Product,
  "id" | "name" | "category" | "price"
>;

/** A product page view. */
export function viewContentData(
  product: ProductSummary,
  unitPrice = product.price,
): MetaCustomData {
  return {
    currency: PIXEL_CURRENCY,
    value: money(unitPrice),
    content_type: "product",
    content_ids: [product.id],
    contents: [{ id: product.id, quantity: 1, item_price: money(unitPrice) }],
    content_name: product.name,
    content_category: product.category,
    num_items: 1,
  };
}

/** One cart line, as it was just added. */
export function addToCartData(
  line: Pick<CartLine, "productId" | "name" | "quantity" | "unitPrice">,
  category?: string,
): MetaCustomData {
  return {
    currency: PIXEL_CURRENCY,
    value: money(line.unitPrice * line.quantity),
    content_type: "product",
    content_ids: [line.productId],
    contents: [
      {
        id: line.productId,
        quantity: line.quantity,
        item_price: money(line.unitPrice),
      },
    ],
    content_name: line.name,
    ...(category ? { content_category: category } : {}),
    num_items: line.quantity,
  };
}

/** The whole basket at the top of checkout. Value is the basket subtotal. */
export function basketData(
  lines: Pick<CartLine, "productId" | "quantity" | "unitPrice">[],
): MetaCustomData {
  return {
    currency: PIXEL_CURRENCY,
    value: money(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)),
    content_type: "product",
    content_ids: lines.map((l) => l.productId),
    contents: lines.map((l) => ({
      id: l.productId,
      quantity: l.quantity,
      item_price: money(l.unitPrice),
    })),
    num_items: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}

/**
 * A placed order.
 *
 * `value` is the total the customer actually pays — delivery, the
 * cash-handling charge and any coupon already taken off — because that is the
 * number the ad spend has to earn back.
 */
export function purchaseData(order: {
  number: Order["number"];
  lines: Pick<OrderLine, "productId" | "quantity" | "unitPrice">[];
  totals: Pick<Order["totals"], "total">;
}): MetaCustomData {
  return {
    ...basketData(order.lines),
    value: money(order.totals.total),
    order_id: order.number,
  };
}

/**
 * The browser and the server both derive a Purchase `event_id` from the order
 * number, so the pair deduplicates with no plumbing between them — and a
 * refresh of the confirmation page cannot invent a second purchase.
 */
export function purchaseEventId(orderNumber: string): string {
  return `purchase.${orderNumber}`;
}
