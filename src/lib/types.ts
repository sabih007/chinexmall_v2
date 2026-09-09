/**
 * Domain model for the storefront.
 *
 * These types are the contract between the UI and the data layer. Swapping the
 * seed data (src/data) for Supabase, the Shopify Storefront API or a custom
 * backend means implementing `src/lib/repository.ts` against the same shapes —
 * no component needs to change.
 */

export type VariantType = "color" | "size" | "style" | "pack";

export interface VariantValue {
  /** Machine value used in cart line items and URLs. */
  value: string;
  /** Human label shown in the UI. */
  label: string;
  /** Swatch colour, for `type: "color"` options. */
  hex?: string;
  /** Added to (or subtracted from) the base price when selected. */
  priceDelta?: number;
  /** Index into `Product.images` to show when this value is selected. */
  imageIndex?: number;
  available?: boolean;
}

export interface VariantOption {
  id: string;
  name: string;
  type: VariantType;
  values: VariantValue[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  /** Category slug — see `src/data/categories.ts`. */
  category: string;
  subcategory?: string;
  description: string;
  /** One-line card copy. */
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  thumbnail: string;
  variants: VariantOption[];
  sku: string;
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  trending: boolean;
  brand: string;
  material: string;
  dimensions: string;
  weight: string;
  shippingInfo: string;
  whatsIncluded: string[];
  details: string[];
  /** Facet used by the shop filters. */
  colorFacet: string;
  productType: string;
  /** Tag slugs — see `Tag`. Shoppers filter by these; the dashboard owns the
   *  vocabulary, so a product can only carry tags that exist. */
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

/**
 * A free-form label on a product — "gift idea", "under 2000", "ramadan".
 *
 * Categories are structural and a product has exactly one; tags are editorial
 * and a product can have any number.
 */
export interface Tag {
  id: string;
  name: string;
  /** What appears in `Product.tags` and in `/shop?tag=…`. */
  slug: string;
  createdAt: string;
}

/** A named colour in the store's palette, used for swatches and the filter. */
export interface Swatch {
  name: string;
  hex: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  heroImage: string;
  /** Shown in the homepage "Shop by category" grid. */
  featured: boolean;
  order: number;
}

export interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  title: string;
  body: string;
  productSlug: string;
  date: string;
  verified: boolean;
}

export interface LookSlot {
  productSlug: string;
  /** Hotspot position on the lifestyle image, in percent. */
  x: number;
  y: number;
}

export interface Look {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  slots: LookSlot[];
}

/** A resolved cart line. Variant selections are stored as option-id → value. */
export interface CartLine {
  /** Stable key: product id + serialised variant selection. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  compareAtPrice?: number;
  quantity: number;
  selections: Record<string, string>;
  /** Pretty-printed variant summary, e.g. "White / Medium". */
  variantLabel: string;
  maxQuantity: number;
}

export type SortKey =
  | "featured"
  | "newest"
  | "best-selling"
  | "price-asc"
  | "price-desc";

export interface ProductQuery {
  categories?: string[];
  tags?: string[];
  productTypes?: string[];
  brands?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  /** "in-stock" hides sold-out items. */
  availability?: "all" | "in-stock";
  onSale?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  trending?: boolean;
  featured?: boolean;
  search?: string;
  sort?: SortKey;
  limit?: number;
  offset?: number;
  excludeSlug?: string;
}

export interface ProductPage {
  items: Product[];
  total: number;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  hex?: string;
}

export interface Facets {
  categories: FacetValue[];
  tags: FacetValue[];
  productTypes: FacetValue[];
  brands: FacetValue[];
  colors: FacetValue[];
  priceRange: { min: number; max: number };
}

/* -------------------------------------------------------------------------- */
/*  Coupons                                                                   */
/* -------------------------------------------------------------------------- */

export type CouponType = "percentage" | "fixed" | "free-shipping";

export interface Coupon {
  id: string;
  /** Uppercase, no spaces — exactly what the customer types in. */
  code: string;
  /** Shown in the dashboard and to the customer once the coupon applies. */
  description: string;
  type: CouponType;
  /** Percent off, or rupees off. Ignored for `free-shipping`. */
  value: number;
  /** Subtotal the basket must reach. `0` means no minimum. */
  minSubtotal: number;
  /** Caps a percentage discount, in rupees. */
  maxDiscount?: number;
  /** ISO dates. Absent means "from now" / "no end". */
  startsAt?: string;
  expiresAt?: string;
  /** Total redemptions allowed across all customers. */
  usageLimit?: number;
  usedCount: number;
  /** Off keeps the code alive but refuses it — no need to delete a seasonal code. */
  active: boolean;
  createdAt: string;
}

/** A coupon as it was applied to one basket, with the discount resolved. */
export interface AppliedCoupon {
  code: string;
  description: string;
  type: CouponType;
  /** Rupees taken off this order. */
  amount: number;
}

/* -------------------------------------------------------------------------- */
/*  Checkout and orders                                                       */
/* -------------------------------------------------------------------------- */

export type DeliveryMethodId = "standard" | "express";
export type PaymentMethodId = "cod" | "bank-transfer";

/** Everything the courier and the packing slip need. */
export interface CustomerDetails {
  firstName: string;
  lastName: string;
  phone: string;
  /** Optional — a phone number is enough to fulfil a cash-on-delivery order. */
  email: string;
  address1: string;
  /** Apartment, floor or a landmark the rider can find. */
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
}

/** A cart line as it was priced at the moment the order was placed. */
export interface OrderLine {
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantLabel: string;
  selections: Record<string, string>;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number;
  lineTotal: number;
}

export interface OrderTotals {
  subtotal: number;
  savings: number;
  delivery: number;
  /** Taken off by a coupon. Zero when none was applied. */
  discount: number;
  /** Cash-handling charge, if the business levies one. */
  codFee: number;
  total: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  /** Human-quotable reference, e.g. `CX-7K3QD2`. */
  number: string;
  placedAt: string;
  status: OrderStatus;
  customer: CustomerDetails;
  delivery: DeliveryMethodId;
  payment: PaymentMethodId;
  lines: OrderLine[];
  totals: OrderTotals;
  /** The coupon the customer redeemed, if any. */
  coupon?: AppliedCoupon;
  /** Delivery window quoted at checkout, e.g. "2–5 working days". */
  eta: string;
}

/**
 * What the browser POSTs to `/api/orders`.
 *
 * Deliberately carries no prices: the server re-prices every line from the
 * catalogue so a tampered basket cannot buy anything cheaply.
 */
export interface CheckoutRequest {
  customer: CustomerDetails;
  delivery: DeliveryMethodId;
  payment: PaymentMethodId;
  /** Re-checked against the coupon store before it is honoured. */
  couponCode?: string;
  items: {
    productId: string;
    quantity: number;
    selections: Record<string, string>;
  }[];
}
