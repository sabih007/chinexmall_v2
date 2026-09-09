/**
 * Cart maths, shared by the client store and the order API.
 *
 * These helpers are deliberately free of React and of `server-only` so that the
 * checkout route can re-price a submitted basket exactly the way the browser
 * priced it — the server never trusts a price that arrives over the wire.
 */

import type { Product } from "./types";

/** Resolves the unit price, image and label for a set of variant selections. */
export function resolveVariant(
  product: Product,
  selections: Record<string, string>,
) {
  let unitPrice = product.price;
  let compareAtPrice = product.compareAtPrice;
  let imageIndex = 0;
  const labels: string[] = [];

  for (const option of product.variants) {
    const chosen = option.values.find((v) => v.value === selections[option.id]);
    if (!chosen) continue;
    unitPrice += chosen.priceDelta ?? 0;
    if (compareAtPrice != null) compareAtPrice += chosen.priceDelta ?? 0;
    if (chosen.imageIndex != null) imageIndex = chosen.imageIndex;
    labels.push(chosen.label);
  }

  return {
    unitPrice,
    compareAtPrice,
    imageIndex: Math.min(imageIndex, Math.max(product.images.length - 1, 0)),
    variantLabel: labels.join(" / "),
  };
}

/**
 * Default selection for a product.
 *
 * Prefers the value that carries no price adjustment, so the price shown on a
 * product card always matches the price the product page opens on. Falls back
 * to the first available value when every option shifts the price.
 */
export function defaultSelections(product: Product) {
  return Object.fromEntries(
    product.variants.map((option) => {
      const available = option.values.filter((v) => v.available !== false);
      const chosen =
        available.find((v) => !v.priceDelta) ?? available[0] ?? option.values[0];
      return [option.id, chosen?.value ?? ""];
    }),
  );
}

/** Stable cart key: product id + serialised variant selection. */
export function lineKey(productId: string, selections: Record<string, string>) {
  const suffix = Object.keys(selections)
    .sort()
    .map((k) => `${k}:${selections[k]}`)
    .join("|");
  return suffix ? `${productId}__${suffix}` : productId;
}
