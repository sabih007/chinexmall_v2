"use client";

import { AlertCircle, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminSection,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/Fields";
import { ImageManager } from "@/components/admin/ImageManager";
import { Button } from "@/components/ui/Button";
import { saveProductAction } from "@/app/admin/actions";
import { initialProductFormState } from "@/lib/admin/form-state";
import {
  emptyProductForm,
  slugify,
  toCommaList,
  toLines,
  type ProductFormErrors,
  type ProductFormField,
  type ProductFormValues,
} from "@/lib/admin/product-form";
import { discountPercent, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import type { Category, Tag } from "@/lib/types";

/** The live taxonomy, read on the server and handed to the form. */
export interface ProductFormOptions {
  categories: Category[];
  tags: Tag[];
  swatches: Record<string, string>;
}

/**
 * Create/edit form for a product.
 *
 * One `<form>` posting to `saveProductAction`. Validation lives in
 * `product-form.ts` and runs on the server; the errors it returns are mapped
 * back onto the fields here, and clear as the operator edits.
 */
export function ProductForm({
  productId,
  initialValues = emptyProductForm,
  submitLabel = "Save product",
  options,
}: {
  productId?: string;
  initialValues?: ProductFormValues;
  submitLabel?: string;
  options: ProductFormOptions;
}) {
  const [state, formAction, pending] = useActionState(
    saveProductAction,
    initialProductFormState,
  );

  // A rejected submission comes back with the values the server actually
  // received — including URLs for photos it has already written to disk. Those
  // become the fields' new starting point, and the changing key remounts them,
  // which also empties the file input so nothing is uploaded twice.
  const echoed = state.status === "error" ? state.values : undefined;

  return (
    <ProductFormFields
      key={echoed ? JSON.stringify(echoed) : "initial"}
      productId={productId}
      initialValues={echoed ?? initialValues}
      initialErrors={state.status === "error" ? state.errors : undefined}
      message={state.status === "error" ? state.message : undefined}
      formAction={formAction}
      pending={pending}
      submitLabel={submitLabel}
      options={options}
    />
  );
}

function ProductFormFields({
  productId,
  initialValues,
  initialErrors,
  message,
  formAction,
  pending,
  submitLabel,
  options,
}: {
  productId?: string;
  initialValues: ProductFormValues;
  initialErrors?: ProductFormErrors;
  message?: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  submitLabel: string;
  options: ProductFormOptions;
}) {
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = useState<ProductFormErrors>(initialErrors ?? {});
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.slug));

  function set<K extends ProductFormField>(field: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  /** Until the operator edits the address themselves, it follows the name. */
  function setName(name: string) {
    setValues((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
    setErrors((current) => ({ ...current, name: undefined, slug: undefined }));
  }

  const swatchList = Object.entries(options.swatches).map(([name, hex]) => ({
    value: name,
    label: name[0].toUpperCase() + name.slice(1),
    hex,
  }));
  const chosenTags = toCommaList(values.tags);

  const images = toLines(values.imageUrls);
  const price = Number(values.price.replace(/,/g, ""));
  const compare = Number(values.compareAtPrice.replace(/,/g, ""));
  const discount =
    Number.isFinite(price) && Number.isFinite(compare)
      ? discountPercent(price, compare)
      : 0;

  return (
    <form action={formAction} className="flex flex-col gap-5 pb-28">
      {productId && <input type="hidden" name="productId" value={productId} />}

      {message && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] text-accent"
        >
          <AlertCircle size={16} strokeWidth={1.8} className="mt-px shrink-0" />
          {message}
        </p>
      )}

      <AdminSection
        title="Basics"
        description="What the product is called, and where it sits in the shop."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Product name"
            htmlFor="name"
            error={errors.name}
            className="sm:col-span-2"
          >
            <AdminInput
              id="name"
              value={values.name}
              error={errors.name}
              placeholder="Ceramic pour-over coffee set"
              onChange={(event) => setName(event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Web address"
            htmlFor="slug"
            error={errors.slug}
            hint={`${site.url.replace(/^https?:\/\//, "")}/product/${values.slug || "…"}`}
          >
            <AdminInput
              id="slug"
              value={values.slug}
              error={errors.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", event.target.value);
              }}
            />
          </AdminField>

          <AdminField label="Category" htmlFor="category" error={errors.category}>
            <AdminSelect
              id="category"
              value={values.category}
              error={errors.category}
              onChange={(event) => set("category", event.target.value)}
            >
              <option value="">Choose a category…</option>
              {options.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <AdminField
            label="Product type"
            htmlFor="productType"
            error={errors.productType}
            hint="Groups the shop filters, e.g. “Coffee set”, “Storage basket”."
          >
            <AdminInput
              id="productType"
              value={values.productType}
              error={errors.productType}
              placeholder="Coffee set"
              onChange={(event) => set("productType", event.target.value)}
            />
          </AdminField>

          <AdminField label="Brand" htmlFor="brand" error={errors.brand}>
            <AdminInput
              id="brand"
              value={values.brand}
              error={errors.brand}
              onChange={(event) => set("brand", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Card summary"
            htmlFor="shortDescription"
            error={errors.shortDescription}
            hint={`${values.shortDescription.length}/160 characters — the single line under the product name.`}
            className="sm:col-span-2"
          >
            <AdminInput
              id="shortDescription"
              value={values.shortDescription}
              error={errors.shortDescription}
              maxLength={160}
              placeholder="Slow-brew ceramic set with a reusable steel filter"
              onChange={(event) => set("shortDescription", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Description"
            htmlFor="description"
            error={errors.description}
            className="sm:col-span-2"
          >
            <AdminTextarea
              id="description"
              rows={5}
              value={values.description}
              error={errors.description}
              placeholder="What it is, what it is made of, and who it is for."
              onChange={(event) => set("description", event.target.value)}
            />
          </AdminField>
        </div>
      </AdminSection>

      <AdminSection
        title="Photos"
        description="The first photo is the one shoppers see on the product card and in their cart."
      >
        <ImageManager
          urls={images}
          onChange={(next) => set("imageUrls", next.join("\n"))}
          pendingFiles={pendingFiles}
          onFilesChange={(files) => setPendingFiles(files ? [...files] : [])}
          error={errors.imageUrls}
        />
      </AdminSection>

      <AdminSection
        title="Price and stock"
        description="Prices are in rupees. Leave the was-price empty unless the product is on sale."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField
            label={`Price (${site.currency.prefix})`}
            htmlFor="price"
            error={errors.price}
            hint={
              Number.isFinite(price) && price > 0
                ? formatPrice(price)
                : undefined
            }
          >
            <AdminInput
              id="price"
              inputMode="decimal"
              value={values.price}
              error={errors.price}
              placeholder="4200"
              onChange={(event) => set("price", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Was price"
            htmlFor="compareAtPrice"
            error={errors.compareAtPrice}
            optional
            hint={discount > 0 ? `Shows as ${discount}% off` : undefined}
          >
            <AdminInput
              id="compareAtPrice"
              inputMode="decimal"
              value={values.compareAtPrice}
              error={errors.compareAtPrice}
              placeholder="5600"
              onChange={(event) => set("compareAtPrice", event.target.value)}
            />
          </AdminField>

          <AdminField label="Stock" htmlFor="stock" error={errors.stock}>
            <AdminInput
              id="stock"
              inputMode="numeric"
              value={values.stock}
              error={errors.stock}
              onChange={(event) => set("stock", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="SKU"
            htmlFor="sku"
            error={errors.sku}
            optional
            hint="Generated from the category if left empty."
          >
            <AdminInput
              id="sku"
              value={values.sku}
              error={errors.sku}
              placeholder="auto"
              onChange={(event) => set("sku", event.target.value)}
            />
          </AdminField>
        </div>
      </AdminSection>

      <AdminSection
        title="Options"
        description="Leave a row empty if the product does not come in that choice. Add a price difference with + or −, e.g. “Large +400”."
      >
        <div className="grid gap-4">
          <AdminField
            label="Colours"
            htmlFor="colorOptions"
            error={errors.colorOptions}
            optional
            hint="Known colours pick up their swatch automatically. For anything else add a hex code, e.g. “Ocean blue #1E5A8A”."
          >
            <AdminInput
              id="colorOptions"
              value={values.colorOptions}
              error={errors.colorOptions}
              placeholder="white, sage, charcoal"
              onChange={(event) => set("colorOptions", event.target.value)}
            />
          </AdminField>

          <div className="-mt-1 flex flex-wrap gap-1.5">
            {swatchList.map((swatch) => {
              const selected = values.colorOptions
                .split(",")
                .map((v) => v.trim().toLowerCase())
                .includes(swatch.value);
              return (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => {
                    const current = values.colorOptions
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean);
                    const next = selected
                      ? current.filter(
                          (v) => v.toLowerCase() !== swatch.value,
                        )
                      : [...current, swatch.value];
                    set("colorOptions", next.join(", "));
                  }}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                    selected
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line hover:border-brand/40"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-full border border-line"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  {swatch.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="Sizes"
              htmlFor="sizeOptions"
              error={errors.sizeOptions}
              optional
            >
              <AdminInput
                id="sizeOptions"
                value={values.sizeOptions}
                error={errors.sizeOptions}
                placeholder="Small, Medium +200, Large +400"
                onChange={(event) => set("sizeOptions", event.target.value)}
              />
            </AdminField>

            <AdminField
              label="Pack sizes"
              htmlFor="packOptions"
              error={errors.packOptions}
              optional
            >
              <AdminInput
                id="packOptions"
                value={values.packOptions}
                error={errors.packOptions}
                placeholder="Set of 2, Set of 4 +900"
                onChange={(event) => set("packOptions", event.target.value)}
              />
            </AdminField>
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Specifics"
        description="What the product page lists under the description."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Colour filter"
            htmlFor="colorFacet"
            error={errors.colorFacet}
            hint="The single colour shoppers filter this product by."
          >
            <AdminInput
              id="colorFacet"
              list="swatch-names"
              value={values.colorFacet}
              error={errors.colorFacet}
              placeholder="white"
              onChange={(event) => set("colorFacet", event.target.value)}
            />
            <datalist id="swatch-names">
              {swatchList.map((swatch) => (
                <option key={swatch.value} value={swatch.value} />
              ))}
            </datalist>
          </AdminField>

          <AdminField label="Material" htmlFor="material" error={errors.material} optional>
            <AdminInput
              id="material"
              value={values.material}
              error={errors.material}
              placeholder="Stoneware ceramic, stainless steel"
              onChange={(event) => set("material", event.target.value)}
            />
          </AdminField>

          <AdminField label="Dimensions" htmlFor="dimensions" error={errors.dimensions} optional>
            <AdminInput
              id="dimensions"
              value={values.dimensions}
              error={errors.dimensions}
              placeholder="18 × 12 × 12 cm"
              onChange={(event) => set("dimensions", event.target.value)}
            />
          </AdminField>

          <AdminField label="Weight" htmlFor="weight" error={errors.weight} optional>
            <AdminInput
              id="weight"
              value={values.weight}
              error={errors.weight}
              placeholder="0.8 kg"
              onChange={(event) => set("weight", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="What's included"
            htmlFor="whatsIncluded"
            error={errors.whatsIncluded}
            optional
            hint="One line per item."
            className="sm:col-span-2"
          >
            <AdminTextarea
              id="whatsIncluded"
              rows={3}
              value={values.whatsIncluded}
              error={errors.whatsIncluded}
              placeholder={"1 × ceramic dripper\n1 × steel filter"}
              onChange={(event) => set("whatsIncluded", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Highlights"
            htmlFor="details"
            error={errors.details}
            optional
            hint="One line per bullet on the product page."
            className="sm:col-span-2"
          >
            <AdminTextarea
              id="details"
              rows={4}
              value={values.details}
              error={errors.details}
              onChange={(event) => set("details", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Shipping note"
            htmlFor="shippingInfo"
            error={errors.shippingInfo}
            optional
            className="sm:col-span-2"
          >
            <AdminTextarea
              id="shippingInfo"
              rows={3}
              value={values.shippingInfo}
              error={errors.shippingInfo}
              onChange={(event) => set("shippingInfo", event.target.value)}
            />
          </AdminField>
        </div>
      </AdminSection>

      <AdminSection
        title="Tags"
        description="Editorial labels shoppers can filter by. A product can carry any number — manage the list under Tags."
      >
        {/* No visible input owns this field, so the chosen slugs ride along in
            a hidden one. */}
        <input type="hidden" name="tags" value={values.tags} />

        {options.tags.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-muted">
            No tags yet.{" "}
            <Link href="/admin/tags" className="text-brand hover:underline">
              Create your first one
            </Link>{" "}
            — things like “gift idea”, “under 2000” or “new in”.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {options.tags.map((tag) => {
              const selected = chosenTags.includes(tag.slug);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    set(
                      "tags",
                      (selected
                        ? chosenTags.filter((slug) => slug !== tag.slug)
                        : [...chosenTags, tag.slug]
                      ).join(", "),
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                    selected
                      ? "border-brand bg-brand-soft font-medium text-brand"
                      : "border-line hover:border-brand/40"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}

        {errors.tags && (
          <p role="alert" className="mt-3 text-[11.5px] text-accent">
            {errors.tags}
          </p>
        )}
      </AdminSection>

      <AdminSection
        title="Merchandising"
        description="Where the product appears beyond its category page."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminCheckbox
            id="featured"
            label="Featured"
            description="Homepage picks and the top of the shop."
            checked={values.featured}
            onChange={(checked) => set("featured", checked)}
          />
          <AdminCheckbox
            id="bestSeller"
            label="Best seller"
            description="Shows on /best-sellers."
            checked={values.bestSeller}
            onChange={(checked) => set("bestSeller", checked)}
          />
          <AdminCheckbox
            id="newArrival"
            label="New arrival"
            description="Shows on /new-arrivals."
            checked={values.newArrival}
            onChange={(checked) => set("newArrival", checked)}
          />
          <AdminCheckbox
            id="trending"
            label="Trending"
            description="Shows in the trending row."
            checked={values.trending}
            onChange={(checked) => set("trending", checked)}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Rating"
            htmlFor="rating"
            error={errors.rating}
            optional
            hint="0–5. Defaults to 4.5."
          >
            <AdminInput
              id="rating"
              inputMode="decimal"
              value={values.rating}
              error={errors.rating}
              placeholder="4.5"
              onChange={(event) => set("rating", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Review count"
            htmlFor="reviewCount"
            error={errors.reviewCount}
            optional
          >
            <AdminInput
              id="reviewCount"
              inputMode="numeric"
              value={values.reviewCount}
              error={errors.reviewCount}
              placeholder="0"
              onChange={(event) => set("reviewCount", event.target.value)}
            />
          </AdminField>
        </div>
      </AdminSection>

      {/* Sticky action bar: the form is long enough that a footer button would
          mean scrolling to the bottom to save. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur lg:left-[248px]">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <p className="hidden text-[12px] text-muted sm:block">
            {images.length + pendingFiles.length} photo
            {images.length + pendingFiles.length === 1 ? "" : "s"} ·{" "}
            {values.name || "Untitled product"}
          </p>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Link
              href="/admin/products"
              className="rounded-full px-4 py-2 text-[13px] text-muted transition-colors hover:text-ink"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
              ) : (
                <Save size={15} strokeWidth={1.8} />
              )}
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
