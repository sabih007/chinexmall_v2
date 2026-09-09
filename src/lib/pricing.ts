import "server-only";

import { resolveVariant } from "./cart";
import { getProductById } from "./repository";
import type { OrderLine } from "./types";

/**
 * Re-prices a submitted basket from the catalogue.
 *
 * The browser sends product ids, quantities and variant selections — never
 * prices. Both `/api/orders` and `/api/coupons` price through here, so a coupon
 * is quoted against exactly the basket the order will be charged for.
 */

const MAX_LINES = 50;

export interface BasketItem {
  productId: string;
  quantity: number;
  selections: Record<string, string>;
}

export type PricedBasket =
  | { ok: true; lines: OrderLine[] }
  | { ok: false; message: string };

/** Pulls the item list out of an untrusted JSON body. */
export function readBasketItems(value: unknown): BasketItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Partial<BasketItem>;
    return {
      productId: typeof raw.productId === "string" ? raw.productId : "",
      quantity: Number(raw.quantity),
      selections:
        raw.selections && typeof raw.selections === "object"
          ? (raw.selections as Record<string, string>)
          : {},
    };
  });
}

export async function priceBasket(items: BasketItem[]): Promise<PricedBasket> {
  if (items.length === 0) return { ok: false, message: "Your cart is empty." };
  if (items.length > MAX_LINES)
    return { ok: false, message: "That is too many items for one order." };

  const lines: OrderLine[] = [];

  for (const item of items) {
    const product = item.productId
      ? await getProductById(item.productId)
      : null;
    if (!product) {
      return {
        ok: false,
        message: "One of these products is no longer available.",
      };
    }

    const quantity = Math.floor(item.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return { ok: false, message: `Choose a quantity for ${product.name}.` };
    }
    if (product.stock < 1) {
      return { ok: false, message: `${product.name} has just sold out.` };
    }
    if (quantity > product.stock) {
      return {
        ok: false,
        message: `Only ${product.stock} left of ${product.name}. Please lower the quantity.`,
      };
    }

    const { unitPrice, compareAtPrice, imageIndex, variantLabel } =
      resolveVariant(product, item.selections);

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[imageIndex] ?? product.thumbnail,
      variantLabel,
      selections: item.selections,
      quantity,
      unitPrice,
      compareAtPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  return { ok: true, lines };
}
