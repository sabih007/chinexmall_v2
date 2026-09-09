import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Primitives";
import { getFacets, getProducts } from "@/lib/repository";
import type { ProductQuery, SortKey } from "@/lib/types";
import { CollectionToolbar, FilterPanel } from "./CollectionFilters";

export type SearchParamsShape = Record<string, string | string[] | undefined>;

const SORT_KEYS: SortKey[] = [
  "featured",
  "newest",
  "best-selling",
  "price-asc",
  "price-desc",
];

function toArray(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Turns URL search params into a `ProductQuery`. Unknown values are ignored
 * rather than trusted, so a hand-edited URL cannot break the page.
 */
export function queryFromSearchParams(
  params: SearchParamsShape,
  base: ProductQuery = {},
): ProductQuery {
  const rawSort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = SORT_KEYS.includes(rawSort as SortKey)
    ? (rawSort as SortKey)
    : base.sort;

  const availability =
    (Array.isArray(params.availability)
      ? params.availability[0]
      : params.availability) === "in-stock"
      ? ("in-stock" as const)
      : undefined;

  const search = Array.isArray(params.q) ? params.q[0] : params.q;

  return {
    ...base,
    categories: [
      ...(base.categories ?? []),
      ...toArray(params.category),
    ].filter(Boolean),
    productTypes: toArray(params.type),
    brands: toArray(params.brand),
    colors: toArray(params.color),
    minPrice: toNumber(params.minPrice),
    maxPrice: toNumber(params.maxPrice),
    availability,
    onSale: base.onSale || toArray(params.sale).includes("true"),
    trending: base.trending || toArray(params.trending).includes("true"),
    search: search || base.search,
    sort,
  };
}

const PAGE_SIZE = 24;

/**
 * Shared product listing used by /shop, /collections/*, /new-arrivals,
 * /best-sellers and /deals (spec §31, §32).
 */
export async function CollectionView({
  searchParams,
  baseQuery = {},
  facetScope,
  hideCategoryFilter,
  emptyMessage = "No products match these filters just yet.",
  basePath,
}: {
  searchParams: SearchParamsShape;
  baseQuery?: ProductQuery;
  /** Scopes facet counts to a single category on collection pages. */
  facetScope?: string;
  hideCategoryFilter?: boolean;
  emptyMessage?: string;
  /** Path used for pagination links. */
  basePath: string;
}) {
  const query = queryFromSearchParams(searchParams, baseQuery);
  const page = Math.max(toNumber(searchParams.page) ?? 1, 1);

  const [{ items, total }, facets] = await Promise.all([
    getProducts({
      ...query,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    getFacets(facetScope ? { category: facetScope } : undefined),
  ]);

  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value == null) continue;
      for (const v of toArray(value)) params.append(key, v);
    }
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <Container>
      <div className="grid gap-10 pb-20 lg:grid-cols-[240px_1fr] lg:gap-12">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <Suspense fallback={null}>
              <FilterPanel facets={facets} hideCategory={hideCategoryFilter} />
            </Suspense>
          </div>
        </aside>

        <div className="min-w-0">
          <Suspense fallback={null}>
            <CollectionToolbar
              facets={facets}
              total={total}
              hideCategory={hideCategoryFilter}
            />
          </Suspense>

          <div className="mt-8">
            {items.length === 0 ? (
              <div className="rounded-card border border-line px-6 py-16 text-center">
                <p className="text-[15px]">{emptyMessage}</p>
                <p className="mt-2 text-[13px] text-muted">
                  Try widening your filters, or browse the full catalogue.
                </p>
                <ButtonLink href="/shop" variant="secondary" className="mt-6">
                  Shop all
                </ButtonLink>
              </div>
            ) : (
              <ProductGrid products={items} priorityCount={4} />
            )}
          </div>

          {pageCount > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-16 flex items-center justify-center gap-2"
            >
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={pageHref(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={
                    n === page
                      ? "flex h-9 min-w-9 items-center justify-center rounded-full bg-brand px-2 text-[12px] font-medium text-paper tabular-nums"
                      : "flex h-9 min-w-9 items-center justify-center rounded-full border border-line px-2 text-[12px] tabular-nums transition-colors hover:border-brand hover:text-brand"
                  }
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </Container>
  );
}
