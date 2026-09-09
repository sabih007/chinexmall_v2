import "server-only";

import { isOrderStatus } from "@/lib/order-status";
import type {
  AppliedCoupon,
  Category,
  Coupon,
  CouponType,
  CustomerRecord,
  Order,
  OrderLine,
  OrderTotals,
  Product,
  SavedAddress,
  Tag,
  VariantOption,
} from "@/lib/types";

/**
 * The shape of every table, and the translation to and from the domain types.
 *
 * All of it lives here so the column names exist in exactly one place: nothing
 * outside `src/lib/supabase` should know that `compareAtPrice` is spelled
 * `compare_at_price` in Postgres.
 *
 * Reads are defensive in the same way the JSON stores are — a row written by a
 * hand-run SQL statement, or by a future migration, must degrade rather than
 * crash a page.
 */

const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const number = (value: unknown, fallback = 0): number => {
  /* PostgREST can hand back `numeric` as a string; Number() settles both. */
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
};

const optionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const parsed = number(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const flag = (value: unknown): boolean => value === true;

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** Postgres timestamps come back as `+00:00`; the app speaks ISO `Z`. */
const iso = (value: unknown, fallback = new Date(0).toISOString()): string => {
  if (typeof value !== "string") return fallback;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
};

const optionalIso = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
};

/** Drops `undefined` values so a partial update never blanks a column. */
function defined<T extends Record<string, unknown>>(row: T): T {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  ) as T;
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  thumbnail: string;
  variants: VariantOption[];
  sku: string;
  stock: number;
  featured: boolean;
  best_seller: boolean;
  new_arrival: boolean;
  trending: boolean;
  brand: string;
  material: string;
  dimensions: string;
  weight: string;
  shipping_info: string;
  whats_included: string[];
  details: string[];
  color_facet: string;
  product_type: string;
  tags: string[];
  rating: number;
  review_count: number;
  created_at: string;
  is_seed: boolean;
  deleted_at: string | null;
  updated_at: string;
}

export function toProduct(row: Record<string, unknown>): Product {
  return {
    id: text(row.id),
    name: text(row.name),
    slug: text(row.slug),
    category: text(row.category),
    ...(text(row.subcategory) ? { subcategory: text(row.subcategory) } : {}),
    description: text(row.description),
    shortDescription: text(row.short_description),
    price: number(row.price),
    ...(row.compare_at_price === null || row.compare_at_price === undefined
      ? {}
      : { compareAtPrice: number(row.compare_at_price) }),
    images: strings(row.images),
    thumbnail: text(row.thumbnail),
    variants: Array.isArray(row.variants) ? (row.variants as VariantOption[]) : [],
    sku: text(row.sku),
    stock: Math.trunc(number(row.stock)),
    featured: flag(row.featured),
    bestSeller: flag(row.best_seller),
    newArrival: flag(row.new_arrival),
    trending: flag(row.trending),
    brand: text(row.brand),
    material: text(row.material),
    dimensions: text(row.dimensions),
    weight: text(row.weight),
    shippingInfo: text(row.shipping_info),
    whatsIncluded: strings(row.whats_included),
    details: strings(row.details),
    colorFacet: text(row.color_facet),
    productType: text(row.product_type),
    tags: strings(row.tags),
    rating: number(row.rating),
    reviewCount: Math.trunc(number(row.review_count)),
    createdAt: iso(row.created_at),
  };
}

export function fromProduct(
  product: Product,
  options: { isSeed?: boolean } = {},
): Record<string, unknown> {
  return defined({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory ?? null,
    description: product.description,
    short_description: product.shortDescription,
    price: product.price,
    compare_at_price: product.compareAtPrice ?? null,
    images: product.images,
    thumbnail: product.thumbnail,
    variants: product.variants,
    sku: product.sku,
    stock: product.stock,
    featured: product.featured,
    best_seller: product.bestSeller,
    new_arrival: product.newArrival,
    trending: product.trending,
    brand: product.brand,
    material: product.material,
    dimensions: product.dimensions,
    weight: product.weight,
    shipping_info: product.shippingInfo,
    whats_included: product.whatsIncluded,
    details: product.details,
    color_facet: product.colorFacet,
    product_type: product.productType,
    tags: product.tags,
    rating: product.rating,
    review_count: product.reviewCount,
    created_at: product.createdAt,
    is_seed: options.isSeed,
    updated_at: new Date().toISOString(),
  });
}

/* -------------------------------------------------------------------------- */
/*  Categories, tags, swatches                                                */
/* -------------------------------------------------------------------------- */

export function toCategory(row: Record<string, unknown>): Category {
  return {
    id: text(row.id),
    name: text(row.name),
    slug: text(row.slug),
    tagline: text(row.tagline),
    description: text(row.description),
    image: text(row.image),
    heroImage: text(row.hero_image),
    featured: flag(row.featured),
    order: Math.trunc(number(row.order)),
  };
}

export function fromCategory(
  category: Category,
  options: { isSeed?: boolean } = {},
): Record<string, unknown> {
  return defined({
    id: category.id,
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    description: category.description,
    image: category.image,
    hero_image: category.heroImage,
    featured: category.featured,
    order: category.order,
    is_seed: options.isSeed,
    updated_at: new Date().toISOString(),
  });
}

export function toTag(row: Record<string, unknown>): Tag {
  return {
    id: text(row.id),
    name: text(row.name),
    slug: text(row.slug),
    createdAt: iso(row.created_at),
  };
}

export function fromTag(tag: Tag): Record<string, unknown> {
  return {
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
    created_at: tag.createdAt,
  };
}

/* -------------------------------------------------------------------------- */
/*  Coupons                                                                   */
/* -------------------------------------------------------------------------- */

const COUPON_TYPES: CouponType[] = ["percentage", "fixed", "free-shipping"];

export function toCoupon(row: Record<string, unknown>): Coupon {
  const type = COUPON_TYPES.includes(row.type as CouponType)
    ? (row.type as CouponType)
    : "fixed";

  const maxDiscount = optionalNumber(row.max_discount);
  const usageLimit = optionalNumber(row.usage_limit);
  const startsAt = optionalIso(row.starts_at);
  const expiresAt = optionalIso(row.expires_at);

  return {
    id: text(row.id),
    code: text(row.code),
    description: text(row.description),
    type,
    value: number(row.value),
    minSubtotal: number(row.min_subtotal),
    ...(maxDiscount === undefined ? {} : { maxDiscount }),
    ...(startsAt === undefined ? {} : { startsAt }),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    ...(usageLimit === undefined ? {} : { usageLimit }),
    usedCount: Math.trunc(number(row.used_count)),
    active: flag(row.active),
    createdAt: iso(row.created_at),
  };
}

export function fromCoupon(coupon: Coupon): Record<string, unknown> {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    min_subtotal: coupon.minSubtotal,
    max_discount: coupon.maxDiscount ?? null,
    starts_at: coupon.startsAt ?? null,
    expires_at: coupon.expiresAt ?? null,
    usage_limit: coupon.usageLimit ?? null,
    used_count: coupon.usedCount,
    active: coupon.active,
    created_at: coupon.createdAt,
  };
}

/* -------------------------------------------------------------------------- */
/*  Customers                                                                 */
/* -------------------------------------------------------------------------- */

function toAddress(value: unknown): SavedAddress | null {
  const a = value as Partial<SavedAddress> | null;
  if (!a || typeof a !== "object" || typeof a.address1 !== "string") return null;
  return {
    address1: text(a.address1),
    address2: text(a.address2),
    city: text(a.city),
    province: text(a.province),
    postalCode: text(a.postalCode),
  };
}

export function toCustomer(row: Record<string, unknown>): CustomerRecord {
  return {
    id: text(row.id),
    email: text(row.email).toLowerCase(),
    firstName: text(row.first_name),
    lastName: text(row.last_name),
    phone: text(row.phone),
    address: toAddress(row.address),
    marketingOptIn: flag(row.marketing_opt_in),
    passwordHash: text(row.password_hash),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function fromCustomer(customer: CustomerRecord): Record<string, unknown> {
  return {
    id: customer.id,
    email: customer.email,
    first_name: customer.firstName,
    last_name: customer.lastName,
    phone: customer.phone,
    address: customer.address,
    marketing_opt_in: customer.marketingOptIn,
    password_hash: customer.passwordHash,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                    */
/* -------------------------------------------------------------------------- */

export function toOrder(row: Record<string, unknown>): Order {
  const coupon = row.coupon as AppliedCoupon | null;

  return {
    number: text(row.number),
    placedAt: iso(row.placed_at),
    status: isOrderStatus(row.status) ? row.status : "pending",
    customer: (row.customer ?? {}) as Order["customer"],
    delivery: text(row.delivery, "standard") as Order["delivery"],
    payment: text(row.payment, "cod") as Order["payment"],
    lines: Array.isArray(row.lines) ? (row.lines as OrderLine[]) : [],
    totals: (row.totals ?? {}) as OrderTotals,
    ...(coupon && typeof coupon === "object" ? { coupon } : {}),
    eta: text(row.eta),
  };
}

export function fromOrder(
  order: Order,
  customerId: string | null,
): Record<string, unknown> {
  return {
    number: order.number,
    placed_at: order.placedAt,
    status: order.status,
    customer_id: customerId,
    customer: order.customer,
    delivery: order.delivery,
    payment: order.payment,
    lines: order.lines,
    totals: order.totals,
    coupon: order.coupon ?? null,
    eta: order.eta,
    updated_at: new Date().toISOString(),
  };
}
