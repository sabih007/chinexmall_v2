import "server-only";

import { categories as seedCategories } from "@/data/categories";
import { looks, socialPosts } from "@/data/looks";
import { products as seedProducts } from "@/data/products";
import { SWATCH } from "@/data/swatches";
import { PLACEHOLDER_REVIEWS, reviews } from "@/data/reviews";
import { findCouponByCode, listCoupons } from "./admin/coupons-store";
import { listProducts, listRemovedSeedProducts } from "./admin/store";
import {
  listCategories,
  listRemovedSeedCategories,
  listRemovedSeedSwatches,
  listSwatches,
  listTags,
} from "./admin/taxonomy-store";
import { discountPercent } from "./format";
import type {
  Category,
  Coupon,
  Facets,
  Tag,
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
  if (q.tags?.length && !q.tags.some((tag) => product.tags.includes(tag)))
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

/* -------------------------------------------------------------------------- */
/*  Effective catalogue                                                       */
/* -------------------------------------------------------------------------- */

const seedIds = new Set(seedProducts.map((p) => p.id));

export function isSeedProduct(id: string): boolean {
  return seedIds.has(id);
}

/**
 * Every product on the storefront, from whichever store is live: the products
 * table, or the seed catalogue with the dashboard's overlay applied. Every
 * read below goes through this, so a product saved in the admin is live on the
 * storefront as soon as its routes revalidate.
 */
export async function getCatalogue(): Promise<Product[]> {
  return listProducts();
}

/** Seed products the operator has removed — the dashboard offers them back. */
export async function getRemovedSeedProducts(): Promise<Product[]> {
  return listRemovedSeedProducts();
}

/* -------------------------------------------------------------------------- */

export async function getProducts(q: ProductQuery = {}): Promise<ProductPage> {
  const filtered = (await getCatalogue()).filter((p) => matches(p, q));
  const sorted = [...filtered].sort(SORTERS[q.sort ?? "featured"]);
  const offset = q.offset ?? 0;
  const items = q.limit != null ? sorted.slice(offset, offset + q.limit) : sorted.slice(offset);
  return { items, total: filtered.length };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await getCatalogue()).find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  return (await getCatalogue()).find((p) => p.id === id) ?? null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  return (await getCatalogue()).map((p) => p.slug);
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const all = await getCatalogue();
  const sameCategory = all.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  );
  const fallback = all.filter(
    (p) => p.category !== product.category && p.slug !== product.slug,
  );
  return [...sameCategory, ...fallback].slice(0, limit);
}

/** Cart drawer / "you may also like" suggestions that avoid what is in the cart. */
export async function getRecommendations(
  excludeSlugs: string[] = [],
  limit = 4,
): Promise<Product[]> {
  const pool = (await getCatalogue()).filter(
    (p) => !excludeSlugs.includes(p.slug),
  );
  return [...pool]
    .sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.rating - a.rating)
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*  Taxonomy                                                                  */
/* -------------------------------------------------------------------------- */

const seedCategoryIds = new Set(seedCategories.map((c) => c.id));

export function isSeedCategory(id: string): boolean {
  return seedCategoryIds.has(id);
}

/** The seed categories with the dashboard's overlay applied, in display order. */
export async function getCategories(options?: {
  featuredOnly?: boolean;
}): Promise<Category[]> {
  const all = await listCategories();
  const list = options?.featuredOnly ? all.filter((c) => c.featured) : all;

  return list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

/** Seed categories the operator has hidden — the dashboard offers them back. */
export async function getRemovedSeedCategories(): Promise<Category[]> {
  return listRemovedSeedCategories();
}

/** The colour palette the shop's facets and the dashboard both read from. */
export async function getSwatches(): Promise<Record<string, string>> {
  return listSwatches();
}

export function isSeedSwatch(name: string): boolean {
  return name in SWATCH;
}

export async function getRemovedSeedSwatches(): Promise<
  { name: string; hex: string }[]
> {
  return listRemovedSeedSwatches();
}

export async function getTags(): Promise<Tag[]> {
  return (await listTags()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  return (await getCatalogue()).reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}

/** Facet values for the shop/collection filter panel, scoped to a category. */
export async function getFacets(scope?: {
  category?: string;
}): Promise<Facets> {
  const all = await getCatalogue();
  const pool = scope?.category
    ? all.filter((p) => p.category === scope.category)
    : all;

  const tally = (values: string[]) =>
    values.reduce<Record<string, number>>((acc, v) => {
      acc[v] = (acc[v] ?? 0) + 1;
      return acc;
    }, {});

  const [categories, tags, swatches] = await Promise.all([
    getCategories(),
    getTags(),
    getSwatches(),
  ]);

  const categoryTally = tally(pool.map((p) => p.category));
  const tagTally = tally(pool.flatMap((p) => p.tags));
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
    tags: Object.entries(tagTally)
      .map(([value, count]) => ({
        value,
        label: tags.find((t) => t.slug === value)?.name ?? value,
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
        hex: swatches[value],
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Coupons                                                                   */
/* -------------------------------------------------------------------------- */

export async function getCoupons(): Promise<Coupon[]> {
  return listCoupons();
}

/** Looks a code up as the customer typed it — matching is case-insensitive. */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  return findCouponByCode(code);
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
  const all = await getCatalogue();
  return look.slots
    .map((slot) => {
      const product = all.find((p) => p.slug === slot.productSlug);
      return product ? { x: slot.x, y: slot.y, product } : null;
    })
    .filter((v): v is { x: number; y: number; product: Product } => v !== null);
}

export async function getSocialPosts() {
  return socialPosts;
}
