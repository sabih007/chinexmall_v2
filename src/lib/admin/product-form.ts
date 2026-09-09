/**
 * The shape of the product form, and the rules that turn it into a `Product`.
 *
 * Isomorphic on purpose, exactly like `src/lib/orders.ts`: the dashboard form
 * uses it to show errors as the operator types, and the Server Action uses the
 * very same functions to decide whether to save — so the two cannot drift.
 *
 * Categories, tags and the colour palette are all editable from the dashboard,
 * so they arrive as arguments rather than being imported. That also keeps the
 * seed catalogue out of the browser bundle.
 */

import { site } from "@/lib/site";
import type { Product, VariantOption, VariantValue } from "@/lib/types";

/** Colour name → hex, as returned by `getSwatches()`. */
export type SwatchMap = Record<string, string>;

export interface ProductFormValues {
  name: string;
  slug: string;
  category: string;
  productType: string;
  brand: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  colorFacet: string;
  material: string;
  dimensions: string;
  weight: string;
  shippingInfo: string;
  whatsIncluded: string;
  details: string;
  /** One image URL per line — existing images plus anything pasted in. */
  imageUrls: string;
  /** Comma-separated tag slugs, chosen from the dashboard's vocabulary. */
  tags: string;
  /** `white, sage, Ocean Blue #1E5A8A` */
  colorOptions: string;
  /** `Small, Medium +200, Large +400` */
  sizeOptions: string;
  packOptions: string;
  rating: string;
  reviewCount: string;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  trending: boolean;
}

export type ProductFormField = keyof ProductFormValues;
export type ProductFormErrors = Partial<Record<ProductFormField, string>>;

export const MAX_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

/**
 * Hosts `next/image` is allowed to optimise, mirroring `images.remotePatterns`
 * in `next.config.ts`. A pasted URL from anywhere else would render as a broken
 * image on the storefront, so the form rejects it up front. A leading dot means
 * "this domain and its subdomains".
 */
export const REMOTE_IMAGE_HOSTS = [
  "images.unsplash.com",
  "cdn.shopify.com",
  ".supabase.co",
];

/** Uploaded photos are site-relative (`/uploads/…`) and always allowed. */
export function isSupportedImageUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return REMOTE_IMAGE_HOSTS.some((host) =>
      host.startsWith(".") ? hostname.endsWith(host) : hostname === host,
    );
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Small parsers                                                             */
/* -------------------------------------------------------------------------- */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Splits a textarea into trimmed, non-empty lines. */
export function toLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function toCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** `"Medium +200"` becomes `{ label: "Medium", delta: 200 }`. */
function parseLabelWithDelta(token: string): { label: string; delta: number } {
  const match = /^(.*?)\s*([+-]\s*\d+(?:\.\d+)?)$/.exec(token);
  if (!match) return { label: token, delta: 0 };
  return {
    label: match[1].trim(),
    delta: Number(match[2].replace(/\s+/g, "")),
  };
}

/**
 * `"Ocean Blue #1E5A8A"` gives a label and hex; a bare name is looked up in the
 * store's palette, so renaming a colour there updates every product using it.
 */
function parseColourToken(
  token: string,
  swatches: SwatchMap,
): VariantValue | null {
  const match = /^(.*?)\s*(#[0-9a-fA-F]{3,8})?$/.exec(token.trim());
  if (!match) return null;

  const label = match[1].trim();
  if (!label) return null;

  const known = swatches[label.toLowerCase()];
  const hex = match[2] ?? known;

  return {
    value: slugify(label),
    label: label[0].toUpperCase() + label.slice(1),
    ...(hex ? { hex } : {}),
    available: true,
  };
}

function optionFromList(
  id: "size" | "pack",
  name: string,
  raw: string,
): VariantOption | null {
  const values = toCommaList(raw).map((token) => {
    const { label, delta } = parseLabelWithDelta(token);
    return {
      value: slugify(label),
      label,
      priceDelta: delta,
      available: true,
    };
  });
  return values.length ? { id, name, type: id, values } : null;
}

export function buildVariants(
  values: ProductFormValues,
  swatches: SwatchMap,
): VariantOption[] {
  const options: VariantOption[] = [];

  const colours = toCommaList(values.colorOptions)
    .map((token) => parseColourToken(token, swatches))
    .filter((value): value is VariantValue => value !== null);

  if (colours.length) {
    options.push({ id: "color", name: "Color", type: "color", values: colours });
  }

  const size = optionFromList("size", "Size", values.sizeOptions);
  if (size) options.push(size);

  const pack = optionFromList("pack", "Pack size", values.packOptions);
  if (pack) options.push(pack);

  return options;
}

/** Turns saved variants back into the comma-separated fields the form shows. */
function variantsToFields(variants: VariantOption[], swatches: SwatchMap) {
  const find = (id: string) => variants.find((v) => v.id === id);

  const withDelta = (id: "size" | "pack") =>
    (find(id)?.values ?? [])
      .map((v) =>
        v.priceDelta
          ? `${v.label} ${v.priceDelta > 0 ? "+" : ""}${v.priceDelta}`
          : v.label,
      )
      .join(", ");

  return {
    colorOptions: (find("color")?.values ?? [])
      .map((v) => (v.hex && !swatches[v.value] ? `${v.label} ${v.hex}` : v.label))
      .join(", "),
    sizeOptions: withDelta("size"),
    packOptions: withDelta("pack"),
  };
}

/* -------------------------------------------------------------------------- */
/*  Defaults                                                                  */
/* -------------------------------------------------------------------------- */

export const emptyProductForm: ProductFormValues = {
  name: "",
  slug: "",
  category: "",
  productType: "",
  brand: site.name,
  shortDescription: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "24",
  sku: "",
  colorFacet: "",
  material: "",
  dimensions: "",
  weight: "",
  shippingInfo: site.shippingBlurb,
  whatsIncluded: "",
  details: [
    "Brand new and factory sealed",
    "Directly imported — no middlemen",
    "Quality-checked before dispatch",
    "7-day easy returns",
  ].join("\n"),
  imageUrls: "",
  tags: "",
  colorOptions: "",
  sizeOptions: "",
  packOptions: "",
  rating: "",
  reviewCount: "",
  featured: false,
  bestSeller: false,
  newArrival: true,
  trending: false,
};

export function productToForm(
  product: Product,
  swatches: SwatchMap,
): ProductFormValues {
  return {
    ...emptyProductForm,
    name: product.name,
    slug: product.slug,
    category: product.category,
    productType: product.productType,
    brand: product.brand,
    shortDescription: product.shortDescription,
    description: product.description,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    stock: String(product.stock),
    sku: product.sku,
    colorFacet: product.colorFacet,
    material: product.material,
    dimensions: product.dimensions,
    weight: product.weight,
    shippingInfo: product.shippingInfo,
    whatsIncluded: product.whatsIncluded.join("\n"),
    details: product.details.join("\n"),
    imageUrls: product.images.join("\n"),
    tags: product.tags.join(", "),
    rating: String(product.rating),
    reviewCount: String(product.reviewCount),
    featured: product.featured,
    bestSeller: product.bestSeller,
    newArrival: product.newArrival,
    trending: product.trending,
    ...variantsToFields(product.variants, swatches),
  };
}

/** Reads a submitted form. Every key is present, so validation sees a whole record. */
export function readProductForm(formData: FormData): ProductFormValues {
  const values: ProductFormValues = { ...emptyProductForm };

  for (const key of Object.keys(values) as ProductFormField[]) {
    const raw = formData.get(key);
    if (typeof values[key] === "boolean") {
      (values[key] as boolean) = raw === "on" || raw === "true";
    } else if (typeof raw === "string") {
      (values[key] as string) = raw;
    }
  }

  return values;
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

function toNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface ValidationContext {
  /** Category slugs the product may be filed under. */
  categorySlugs: string[];
  /** The dashboard's tag vocabulary. Anything else is rejected. */
  tagSlugs?: string[];
  /** Every slug already in the catalogue, minus the product being edited. */
  takenSlugs?: string[];
  /** Images already attached, plus anything uploaded in this submission. */
  imageCount?: number;
}

export function validateProductForm(
  values: ProductFormValues,
  context: ValidationContext,
): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const text = (field: ProductFormField) => String(values[field]).trim();

  if (text("name").length < 2) errors.name = "Give the product a name.";
  else if (text("name").length > 100)
    errors.name = "Keep the name under 100 characters.";

  const slug = text("slug") || slugify(text("name"));
  if (!slug) errors.slug = "The web address cannot be empty.";
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    errors.slug = "Use lowercase letters, numbers and hyphens only.";
  else if (context.takenSlugs?.includes(slug))
    errors.slug = "Another product already uses this web address.";

  if (!context.categorySlugs.includes(text("category")))
    errors.category = "Choose a category.";

  if (text("productType").length < 2)
    errors.productType = "Add a product type — the shop filters group by it.";

  if (context.tagSlugs) {
    const unknown = toCommaList(values.tags).find(
      (tag) => !context.tagSlugs?.includes(tag),
    );
    if (unknown)
      errors.tags = `“${unknown}” is not one of your tags. Create it under Tags first.`;
  }

  if (text("shortDescription").length < 5)
    errors.shortDescription = "Add a one-line summary for the product card.";
  else if (text("shortDescription").length > 160)
    errors.shortDescription = "Keep the summary under 160 characters.";

  if (text("description").length < 20)
    errors.description = "Add a fuller description — at least 20 characters.";

  const price = toNumber(values.price);
  if (price === null) errors.price = "Enter a price.";
  else if (price <= 0) errors.price = "The price must be more than zero.";

  const compare = toNumber(values.compareAtPrice);
  if (values.compareAtPrice.trim() && compare === null)
    errors.compareAtPrice = "Enter a number, or leave it empty.";
  else if (compare !== null && price !== null && compare <= price)
    errors.compareAtPrice = "The was-price must be higher than the price.";

  const stock = toNumber(values.stock);
  if (stock === null) errors.stock = "Enter how many you have.";
  else if (stock < 0 || !Number.isInteger(stock))
    errors.stock = "Stock must be a whole number, zero or more.";

  const rating = toNumber(values.rating);
  if (values.rating.trim() && (rating === null || rating < 0 || rating > 5))
    errors.rating = "A rating is between 0 and 5.";

  const reviews = toNumber(values.reviewCount);
  if (values.reviewCount.trim() && (reviews === null || reviews < 0))
    errors.reviewCount = "Enter a whole number, or leave it empty.";

  if (!text("colorFacet"))
    errors.colorFacet = "Pick the colour shoppers should filter this by.";

  const images = toLines(values.imageUrls);
  const imageCount = context.imageCount ?? images.length;
  const unsupported = images.find((url) => !isSupportedImageUrl(url));

  if (imageCount < 1) errors.imageUrls = "Add at least one product photo.";
  else if (imageCount > MAX_IMAGES)
    errors.imageUrls = `A product can have at most ${MAX_IMAGES} photos.`;
  else if (unsupported)
    errors.imageUrls = `Photos cannot be loaded from that address (${unsupported.slice(0, 60)}). Upload the file instead, or add its domain to images.remotePatterns in next.config.ts.`;

  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Building                                                                  */
/* -------------------------------------------------------------------------- */

function autoSku(category: string, slug: string): string {
  const stem =
    category.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "GEN";
  const tail =
    slug.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase() || "0001";
  return `${site.orderPrefix}-${stem}-${tail}`;
}

/**
 * Produces the `Product` the storefront will render. Assumes the values have
 * already passed `validateProductForm`.
 */
export function buildProduct(
  values: ProductFormValues,
  context: {
    id: string;
    images: string[];
    swatches: SwatchMap;
    createdAt?: string;
  },
): Product {
  const name = values.name.trim();
  const slug = (values.slug.trim() || slugify(name)).toLowerCase();
  const category = values.category.trim();
  const price = Number(values.price.trim().replace(/,/g, ""));
  const compare = values.compareAtPrice.trim()
    ? Number(values.compareAtPrice.trim().replace(/,/g, ""))
    : undefined;

  const whatsIncluded = toLines(values.whatsIncluded);

  return {
    id: context.id,
    name,
    slug,
    category,
    description: values.description.trim(),
    shortDescription: values.shortDescription.trim(),
    price,
    ...(compare !== undefined ? { compareAtPrice: compare } : {}),
    images: context.images,
    thumbnail: context.images[0],
    variants: buildVariants(values, context.swatches),
    sku: values.sku.trim().toUpperCase() || autoSku(category, slug),
    stock: Number(values.stock.trim()),
    featured: values.featured,
    bestSeller: values.bestSeller,
    newArrival: values.newArrival,
    trending: values.trending,
    brand: values.brand.trim() || site.name,
    material: values.material.trim() || "See product details",
    dimensions: values.dimensions.trim() || "See product details",
    weight: values.weight.trim() || "0.5 kg",
    shippingInfo: values.shippingInfo.trim() || site.shippingBlurb,
    whatsIncluded: whatsIncluded.length ? whatsIncluded : [`1 × ${name}`],
    details: toLines(values.details),
    colorFacet: slugify(values.colorFacet) || "white",
    productType: values.productType.trim(),
    tags: [...new Set(toCommaList(values.tags))],
    rating: values.rating.trim() ? Number(values.rating.trim()) : 4.5,
    reviewCount: values.reviewCount.trim()
      ? Number(values.reviewCount.trim())
      : 0,
    createdAt: context.createdAt ?? new Date().toISOString(),
  };
}
