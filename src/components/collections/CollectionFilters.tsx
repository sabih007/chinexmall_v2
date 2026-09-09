"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { Facets, SortKey } from "@/lib/types";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Filters + sort (spec §31)                                                 */
/*                                                                            */
/*  All state lives in the URL, so a filtered view is shareable, indexable and */
/*  survives a refresh or a back button.                                       */
/* -------------------------------------------------------------------------- */

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best selling" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** Which query keys the filter UI owns (everything else is preserved). */
const FILTER_KEYS = [
  "category",
  "tag",
  "type",
  "brand",
  "color",
  "minPrice",
  "maxPrice",
  "availability",
  "sale",
] as const;

function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      update((params) => {
        const current = params.getAll(key);
        params.delete(key);
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        for (const v of next) params.append(key, v);
      });
    },
    [update],
  );

  const setSingle = useCallback(
    (key: string, value: string | null) => {
      update((params) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
    },
    [update],
  );

  const removeValue = useCallback(
    (key: string, value: string) => {
      update((params) => {
        const remaining = params.getAll(key).filter((v) => v !== value);
        params.delete(key);
        for (const v of remaining) params.append(key, v);
      });
    },
    [update],
  );

  const clearAll = useCallback(() => {
    update((params) => {
      for (const key of FILTER_KEYS) params.delete(key);
    });
  }, [update]);

  return { searchParams, update, toggleMulti, setSingle, removeValue, clearAll };
}

export function activeFilterCount(searchParams: URLSearchParams) {
  return FILTER_KEYS.reduce(
    (n, key) => n + searchParams.getAll(key).filter(Boolean).length,
    0,
  );
}

/* ------------------------------- panel ------------------------------------ */

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line py-6 last:border-0">
      <h3 className="eyebrow mb-4 text-muted">{title}</h3>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
  swatch,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  swatch?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[13px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
          checked ? "border-brand bg-brand" : "border-line",
        )}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="h-2 w-2.5 fill-none stroke-paper stroke-2">
            <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {swatch && (
        <span
          aria-hidden
          className="h-4 w-4 shrink-0 rounded-full border border-line"
          style={{ backgroundColor: swatch }}
        />
      )}
      <span className="flex-1">{label}</span>
      <span className="text-[11.5px] text-muted tabular-nums">{count}</span>
    </label>
  );
}

export function FilterPanel({
  facets,
  hideCategory,
}: {
  facets: Facets;
  hideCategory?: boolean;
}) {
  const { searchParams, toggleMulti, setSingle, clearAll } = useFilterParams();

  const selected = useMemo(
    () => ({
      category: searchParams.getAll("category"),
      tag: searchParams.getAll("tag"),
      type: searchParams.getAll("type"),
      brand: searchParams.getAll("brand"),
      color: searchParams.getAll("color"),
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      availability: searchParams.get("availability") ?? "all",
      sale: searchParams.get("sale") === "true",
    }),
    [searchParams],
  );

  const count = activeFilterCount(
    new URLSearchParams(searchParams.toString()),
  );

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line pb-4">
        <p className="text-[13px] font-semibold">
          Filter
        </p>
        {count > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11.5px] text-muted underline underline-offset-4 hover:text-ink"
          >
            Clear all ({count})
          </button>
        )}
      </div>

      {!hideCategory && facets.categories.length > 1 && (
        <FilterGroup title="Category">
          {facets.categories.map((f) => (
            <CheckRow
              key={f.value}
              label={f.label}
              count={f.count}
              checked={selected.category.includes(f.value)}
              onChange={() => toggleMulti("category", f.value)}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(facets.priceRange.min)}
            defaultValue={selected.minPrice}
            onBlur={(e) => setSingle("minPrice", e.target.value)}
            aria-label="Minimum price"
            className="w-full rounded-full border border-line px-4 py-2 text-[13px] outline-none focus:border-brand"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(facets.priceRange.max)}
            defaultValue={selected.maxPrice}
            onBlur={(e) => setSingle("maxPrice", e.target.value)}
            aria-label="Maximum price"
            className="w-full rounded-full border border-line px-4 py-2 text-[13px] outline-none focus:border-brand"
          />
        </div>
        <p className="mt-2 text-[11.5px] text-muted">
          Catalogue range {formatPrice(facets.priceRange.min)} –{" "}
          {formatPrice(facets.priceRange.max)}
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-[13px]">
          <input
            type="checkbox"
            checked={selected.sale}
            onChange={() => setSingle("sale", selected.sale ? null : "true")}
            className="sr-only"
          />
          <span
            aria-hidden
            className={cn(
              "flex h-4 w-4 items-center justify-center border transition-colors",
              selected.sale ? "border-brand bg-brand" : "border-line",
            )}
          >
            {selected.sale && (
              <svg viewBox="0 0 10 8" className="h-2 w-2.5 fill-none stroke-paper stroke-2">
                <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          On sale only
        </label>
      </FilterGroup>

      {facets.tags.length > 0 && (
        <FilterGroup title="Tags">
          <div className="max-h-60 overflow-y-auto pr-1">
            {facets.tags.map((f) => (
              <CheckRow
                key={f.value}
                label={f.label}
                count={f.count}
                checked={selected.tag.includes(f.value)}
                onChange={() => toggleMulti("tag", f.value)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Product type">
        <div className="max-h-60 overflow-y-auto pr-1">
          {facets.productTypes.map((f) => (
            <CheckRow
              key={f.value}
              label={f.label}
              count={f.count}
              checked={selected.type.includes(f.value)}
              onChange={() => toggleMulti("type", f.value)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Colour">
        {facets.colors.map((f) => (
          <CheckRow
            key={f.value}
            label={f.label}
            count={f.count}
            checked={selected.color.includes(f.value)}
            onChange={() => toggleMulti("color", f.value)}
            swatch={f.hex}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        {facets.brands.map((f) => (
          <CheckRow
            key={f.value}
            label={f.label}
            count={f.count}
            checked={selected.brand.includes(f.value)}
            onChange={() => toggleMulti("brand", f.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        {[
          { value: "all", label: "All products" },
          { value: "in-stock", label: "In stock only" },
        ].map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 py-1.5 text-[13px]"
          >
            <input
              type="radio"
              name="availability"
              checked={selected.availability === option.value}
              onChange={() =>
                setSingle(
                  "availability",
                  option.value === "all" ? null : option.value,
                )
              }
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                selected.availability === option.value
                  ? "border-brand"
                  : "border-line",
              )}
            >
              {selected.availability === option.value && (
                <span className="h-2 w-2 rounded-full bg-brand" />
              )}
            </span>
            {option.label}
          </label>
        ))}
      </FilterGroup>
    </div>
  );
}

/* ---------------------------- toolbar + drawer ---------------------------- */

export function CollectionToolbar({
  facets,
  total,
  hideCategory,
}: {
  facets: Facets;
  total: number;
  hideCategory?: boolean;
}) {
  const { searchParams, setSingle, removeValue, clearAll } = useFilterParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sort = (searchParams.get("sort") as SortKey) ?? "featured";
  const count = activeFilterCount(new URLSearchParams(searchParams.toString()));

  return (
    <>
      <div className="sticky top-14 z-30 -mx-5 flex items-center justify-between gap-4 border-b border-line bg-paper/90 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[12.5px] font-medium lg:hidden"
        >
          <SlidersHorizontal size={15} strokeWidth={1.6} />
          Filter
          {count > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] text-paper tabular-nums">
              {count}
            </span>
          )}
        </button>

        <p className="hidden text-[12px] text-muted tabular-nums lg:block">
          {total} product{total === 1 ? "" : "s"}
        </p>

        <label className="flex items-center gap-2 text-[12.5px] text-muted">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSingle("sort", e.target.value)}
            className="cursor-pointer border-0 bg-transparent py-1 pr-5 text-[12px] font-medium normal-case tracking-normal text-ink outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Active filter chips */}
      {count > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {FILTER_KEYS.flatMap((key) =>
            searchParams.getAll(key).filter(Boolean).map((value) => (
              <li key={`${key}-${value}`}>
                <button
                  type="button"
                  onClick={() => removeValue(key, value)}
                  aria-label={`Remove filter ${value}`}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11.5px] transition-colors hover:border-brand hover:text-brand"
                >
                  {value}
                  <X size={12} strokeWidth={1.8} className="text-muted" />
                </button>
              </li>
            )),
          )}
          <li>
            <button
              type="button"
              onClick={clearAll}
              className="px-2 py-1.5 text-[11.5px] text-muted underline underline-offset-4 hover:text-ink"
            >
              Clear all
            </button>
          </li>
        </ul>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="bottom"
        title="Filter"
        footer={
          <div className="px-5 py-4">
            <Button full size="lg" onClick={() => setDrawerOpen(false)}>
              Show {total} product{total === 1 ? "" : "s"}
            </Button>
          </div>
        }
      >
        <div className="px-5 pb-4">
          <FilterPanel facets={facets} hideCategory={hideCategory} />
        </div>
      </Drawer>
    </>
  );
}
