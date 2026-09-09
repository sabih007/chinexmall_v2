import { site } from "./site";
import type { Product } from "./types";

const numberFormat = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 0,
});

/** `1499` → `Rs. 1,499` */
export function formatPrice(value: number): string {
  return `${site.currency.prefix} ${numberFormat.format(Math.round(value))}`;
}

/** Whole-number discount, or `0` when the product is not on sale. */
export function discountPercent(
  price: number,
  compareAtPrice?: number,
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function isOnSale(product: Pick<Product, "price" | "compareAtPrice">) {
  return discountPercent(product.price, product.compareAtPrice) > 0;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Rs. 900 away from free delivery" progress, clamped to 0–1. */
export function freeShippingProgress(subtotal: number) {
  const threshold = site.freeShippingThreshold;
  const remaining = Math.max(threshold - subtotal, 0);
  return {
    threshold,
    remaining,
    qualified: remaining === 0,
    ratio: Math.min(subtotal / threshold, 1),
  };
}
