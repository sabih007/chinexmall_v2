import { AlertCircle, CheckCircle2, FolderPlus, Pencil } from "lucide-react";
import Link from "next/link";
import { deleteCategoryAction, restoreCategoryAction } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import {
  getCatalogue,
  getCategories,
  getRemovedSeedCategories,
  isSeedCategory,
} from "@/lib/repository";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    removed?: string;
    restored?: string;
    blocked?: string;
    count?: string;
  }>;
}) {
  const { saved, removed, restored, blocked, count } = await searchParams;

  const [categories, catalogue, removedSeed] = await Promise.all([
    getCategories(),
    getCatalogue(),
    getRemovedSeedCategories(),
  ]);

  const productCount = (slug: string) =>
    catalogue.filter((p) => p.category === slug).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.5rem]">Categories</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {categories.length} categories · they drive the menu, the homepage
            grid, the filters and the sitemap
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover"
        >
          <FolderPlus size={16} strokeWidth={1.8} />
          New category
        </Link>
      </header>

      {blocked && (
        <p className="flex items-start gap-2.5 rounded-[10px] border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] text-accent">
          <AlertCircle size={16} strokeWidth={1.8} className="mt-px shrink-0" />
          <span>
            <strong className="font-medium">{blocked}</strong> still has {count}{" "}
            product{count === "1" ? "" : "s"} in it. Move them to another
            category first — removing it now would strand them.
          </span>
        </p>
      )}

      {(saved || removed || restored) && (
        <p className="flex items-center gap-2.5 rounded-[10px] border border-mint-deep bg-mint px-4 py-3 text-[13px] text-mint-ink">
          <CheckCircle2 size={16} strokeWidth={1.8} className="shrink-0" />
          {saved && `Saved ${saved}.`}
          {removed && "Category removed from the storefront."}
          {restored && "Category restored."}
        </p>
      )}

      <ul className="overflow-hidden rounded-tile border border-line bg-paper shadow-card">
        {categories.map((category) => {
          const used = productCount(category.slug);

          return (
            <li
              key={category.id}
              className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0 sm:px-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={category.image}
                alt=""
                className="h-12 w-12 shrink-0 rounded-[8px] border border-line object-cover"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="truncate text-[13.5px] font-medium hover:text-brand"
                  >
                    {category.name}
                  </Link>
                  {category.featured && (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-[10.5px] font-medium text-ink-soft">
                      Featured
                    </span>
                  )}
                  {!isSeedCategory(category.id) && (
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-medium text-brand">
                      Added here
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted">
                  /{category.slug} · {category.tagline}
                </p>
              </div>

              <div className="w-20 shrink-0 text-right">
                <p className="text-[13px] font-medium tabular-nums">{used}</p>
                <p className="text-[11.5px] text-muted">
                  product{used === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <Link
                  href={`/admin/categories/${category.id}`}
                  aria-label={`Edit ${category.name}`}
                  title={`Edit ${category.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
                >
                  <Pencil size={15} strokeWidth={1.7} />
                </Link>
                {used === 0 && (
                  <ConfirmSubmit
                    action={deleteCategoryAction}
                    name="categoryId"
                    value={category.id}
                    label={`Remove ${category.name}`}
                    confirmLabel="Remove"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {removedSeed.length > 0 && (
        <section className="rounded-tile border border-line bg-paper p-5 shadow-card">
          <h2 className="text-[14px] font-semibold">Removed categories</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            These came with the store and are hidden. Nothing was deleted.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {removedSeed.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <span className="truncate text-[13px] text-ink-soft">
                  {category.name}
                </span>
                <form action={restoreCategoryAction}>
                  <input type="hidden" name="categoryId" value={category.id} />
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

      <p className="text-[12px] leading-relaxed text-muted">
        A category can only be removed once nothing is filed under it, so no
        product is ever left pointing at a page that no longer exists.
      </p>
    </div>
  );
}
