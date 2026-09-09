import { site } from "./site";
import type { Product } from "./types";

/**
 * Builds a wa.me link with a pre-filled enquiry (spec §37) including the
 * product name, chosen variant and the canonical product URL.
 */
export function whatsappLink(options?: {
  product?: Pick<Product, "name" | "slug">;
  variantLabel?: string;
  quantity?: number;
  message?: string;
}) {
  const base = `https://wa.me/${site.whatsapp.number}`;

  if (options?.message) {
    return `${base}?text=${encodeURIComponent(options.message)}`;
  }

  if (!options?.product) {
    return `${base}?text=${encodeURIComponent(
      `Hi ${site.name}, I have a question about an order.`,
    )}`;
  }

  const { product, variantLabel, quantity } = options;
  const lines = [
    `Hi, I'm interested in ${product.name}. Is it available?`,
    variantLabel ? `Variant: ${variantLabel}` : null,
    quantity && quantity > 1 ? `Quantity: ${quantity}` : null,
    `${site.url}/product/${product.slug}`,
  ].filter(Boolean);

  return `${base}?text=${encodeURIComponent(lines.join("\n"))}`;
}
