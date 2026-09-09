import "server-only";

import { categories } from "@/data/categories";
import { looks, socialPosts } from "@/data/looks";
import { colorSwatches, products } from "@/data/products";
import { PLACEHOLDER_REVIEWS, reviews } from "@/data/reviews";
import { discountPercent } from "./format";
import type {
  Category,
  Facets,
  Look,
  Product,
  ProductPage,
  ProductQuery,
  Review,
  SortKey,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Data access layer                                                         */
/*                                                                            */
/*  Every read the UI performs goes through this module, and every function    */
/*  is async. Swapping the in-memory seed for Supabase, the Shopify Storefront */
/*  API or a custom admin backend means reimplementing this file only —        */
/*  no page or component changes (spec §05, §42, §43).                        */
/* -------------------------------------------------------------------------- */

const SORTERS: Record<SortKey, (a: Product, b: Product) => number> = {
  featured: (a, b) =>
    Number(b.featured) - Number(a.featured) ||
    Number(b.bestSeller) - Number(a.bestSeller) ||
    b.rating - a.rating,
  newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  "best-selling": (a, b) =>
    Number(b.bestSeller) - Number(a.bestSeller) || b.reviewCount - a.reviewCount,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
};

function matches(product: Product, q: ProductQuery): boolean {
  if (q.excludeSlug && product.slug === q.excludeSlug) return false;
  if (q.categories?.length && !q.categories.includes(product.category))
    return false;
  if (q.productTypes?.length && !q.productTypes.includes(product.productType))
    return false;
  if (q.brands?.length && !q.brands.includes(product.brand)) return false;
  if (q.colors?.length && !q.colors.includes(product.colorFacet)) return false;
  if (q.minPrice != null && product.price < q.minPrice) return false;
  if (q.maxPrice != null && product.price > q.maxPrice) return false;
  if (q.availability === "in-stock" && product.stock <= 0) return false;
  if (q.onSale && discountPercent(product.price, product.compareAtPrice) === 0)
    return false;
  if (q.newArrival && !product.newArrival) return false;
  if (q.bestSeller && !product.bestSeller) return false;
  if (q.trending && !product.trending) return false;
  if (q.featured && !product.featured) return false;

  if (q.search) {
    const needle = q.search.trim().toLowerCase();
    if (needle) {
      const haystack = [
        product.name,
        product.shortDescription,
        product.description,
        product.productType,
        product.brand,
        product.category,
        product.colorFacet,
      ]
        .join(" ")
        .toLowerCase();
      if (!needle.split(/\s+/).every((term) => haystack.includes(term)))
        return false;
    }
  }

  return true;
}

export async function getProducts(q: ProductQuery = {}): Promise<ProductPage> {
  const filtered = products.filter((p) => matches(p, q));
  const sorted = [...filtered].sort(SORTERS[q.sort ?? "featured"]);
  const offset = q.offset ?? 0;
  const items = q.limit != null ? sorted.slice(offset, offset + q.limit) : sorted.slice(offset);
  return { items, total: filtered.length };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  return products.find((p) => p.id === id) ?? null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  return products.map((p) => p.slug);
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const sameCategory = products.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  );
  const fallback = products.filter(
    (p) => p.category !== product.category && p.slug !== product.slug,
  );
  return [...sameCategory, ...fallback].slice(0, limit);
}

/** Cart drawer / "you may also like" suggestions that avoid what is in the cart. */
export async function getRecommendations(
  excludeSlugs: string[] = [],
  limit = 4,
): Promise<Product[]> {
  const pool = products.filter((p) => !excludeSlugs.includes(p.slug));
  return [...pool]
    .sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.rating - a.rating)
    .slice(0, limit);
}

export async function getCategories(options?: {
  featuredOnly?: boolean;
}): Promise<Category[]> {
  const list = options?.featuredOnly
    ? categories.filter((c) => c.featured)
    : categories;
  return [...list].sort((a, b) => a.order - b.order);
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  return products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}

/** Facet values for the shop/collection filter panel, scoped to a category. */
export async function getFacets(scope?: {
  category?: string;
}): Promise<Facets> {
  const pool = scope?.category
    ? products.filter((p) => p.category === scope.category)
    : products;

  const tally = (values: string[]) =>
    values.reduce<Record<string, number>>((acc, v) => {
      acc[v] = (acc[v] ?? 0) + 1;
      return acc;
    }, {});

  const categoryTally = tally(pool.map((p) => p.category));
  const typeTally = tally(pool.map((p) => p.productType));
  const brandTally = tally(pool.map((p) => p.brand));
  const colorTally = tally(pool.map((p) => p.colorFacet));

  const prices = pool.map((p) => p.price);

  return {
    categories: Object.entries(categoryTally)
      .map(([value, count]) => ({
        value,
        label: categories.find((c) => c.slug === value)?.name ?? value,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    productTypes: Object.entries(typeTally)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    brands: Object.entries(brandTally)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    colors: Object.entries(colorTally)
      .map(([value, count]) => ({
        value,
        label: value[0].toUpperCase() + value.slice(1),
        count,
        hex: colorSwatches[value],
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
  };
}

export async function getReviews(limit?: number): Promise<Review[]> {
  const sorted = [...reviews].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getReviewsForProduct(slug: string): Promise<Review[]> {
  return reviews.filter((r) => r.productSlug === slug);
}

export const reviewsArePlaceholder = PLACEHOLDER_REVIEWS;

export async function getLooks(): Promise<Look[]> {
  return looks;
}

export async function getLookProducts(
  look: Look,
): Promise<{ x: number; y: number; product: Product }[]> {
  return look.slots
    .map((slot) => {
      const product = products.find((p) => p.slug === slot.productSlug);
      return product ? { x: slot.x, y: slot.y, product } : null;
    })
    .filter((v): v is { x: number; y: number; product: Product } => v !== null);
}

export async function getSocialPosts() {
  return socialPosts;
}
