import { CheckCircle2, PackagePlus, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { restoreProductAction } from "@/app/admin/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { discountPercent, formatPrice } from "@/lib/format";
import {
  getCatalogue,
  getCategories,
  getRemovedSeedProducts,
  isSeedProduct,
} from "@/lib/repository";

export const metadata = { title: "Products" };

interface PageProps {
  searchParams: Promise<{
    q?: string;
    saved?: string;
    removed?: string;
    restored?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { q = "", saved, removed, restored } = await searchParams;

  const [products, categories, removedSeed] = await Promise.all([
    getCatalogue(),
    getCategories(),
    getRemovedSeedProducts(),
  ]);

  const needle = q.trim().toLowerCase();
  const visible = needle
    ? products.filter((product) =>
        [product.name, product.sku, product.productType, product.brand]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : products;

  const categoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.5rem]">Products</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {products.length} live on the storefront
            {needle && ` · ${visible.length} matching “${q}”`}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover"
        >
          <PackagePlus size={16} strokeWidth={1.8} />
          Add product
        </Link>
      </header>

      {(saved || removed || restored) && (
        <p className="flex items-center gap-2.5 rounded-[10px] border border-mint-deep bg-mint px-4 py-3 text-[13px] text-mint-ink">
          <CheckCircle2 size={16} strokeWidth={1.8} className="shrink-0" />
          {saved && (
            <>
              Saved.{" "}
              <Link
                href={`/product/${saved}`}
                target="_blank"
                className="underline underline-offset-2"
              >
                View it on the store
              </Link>
            </>
          )}
          {removed && "Product removed from the storefront."}
          {restored && "Product restored."}
        </p>
      )}

      {/* A GET form: the search term lives in the URL, so a result list can be
          bookmarked and survives a save-and-return. */}
      <form className="relative">
        <Search
          size={16}
          strokeWidth={1.7}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, type, brand or SKU"
          aria-label="Search products"
          className="w-full rounded-full border border-line bg-paper py-2.5 pl-11 pr-4 text-[13.5px] outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
        />
      </form>

      {visible.length === 0 ? (
        <p className="rounded-tile border border-dashed border-line bg-paper px-5 py-14 text-center text-[13px] text-muted">
          No products match that search.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-tile border border-line bg-paper shadow-card">
          {visible.map((product) => {
            const discount = discountPercent(
              product.price,
              product.compareAtPrice,
            );

            return (
              <li
                key={product.id}
                className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0 sm:px-5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.thumbnail}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-[8px] border border-line object-cover"
                />

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="block truncate text-[13.5px] font-medium hover:text-brand"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-0.5 truncate text-[12px] text-muted">
                    {categoryName(product.category)} · {product.sku}
                    {!isSeedProduct(product.id) && " · added here"}
                  </p>
                </div>

                <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                  {product.featured && <Flag label="Featured" />}
                  {product.bestSeller && <Flag label="Best seller" />}
                  {product.newArrival && <Flag label="New" />}
                  {discount > 0 && <Flag label={`${discount}% off`} tone="sale" />}
                </div>

                <div className="w-20 shrink-0 text-right">
                  <p className="text-[13px] font-medium tabular-nums">
                    {formatPrice(product.price)}
                  </p>
                  <p
                    className={`text-[11.5px] tabular-nums ${
                      product.stock <= 0 ? "text-accent" : "text-muted"
                    }`}
                  >
                    {product.stock <= 0 ? "Sold out" : `${product.stock} in stock`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <Link
                    href={`/admin/products/${product.id}`}
                    aria-label={`Edit ${product.name}`}
                    title={`Edit ${product.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
                  >
                    <Pencil size={15} strokeWidth={1.7} />
                  </Link>
                  <DeleteProductButton
                    productId={product.id}
                    name={product.name}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {removedSeed.length > 0 && (
        <section className="rounded-tile border border-line bg-paper p-5 shadow-card">
          <h2 className="text-[14px] font-semibold">Removed products</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            These came with the starting catalogue and are hidden from the
            storefront. Nothing was deleted — put any of them back at any time.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {removedSeed.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <span className="truncate text-[13px] text-ink-soft">
                  {product.name}
                </span>
                <form action={restoreProductAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-3 py-1.5 text-[11.5px] transition-colors hover:border-brand hover:text-brand"
                  >
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Flag({ label, tone }: { label: string; tone?: "sale" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
        tone === "sale" ? "bg-accent-soft text-accent" : "bg-sand text-ink-soft"
      }`}
    >
      {label}
    </span>
  );
}
