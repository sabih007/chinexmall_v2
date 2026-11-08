import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { CategorySlider } from "@/components/home/CategorySlider";

const COLUMNS: Record<3 | 4 | 5, string> = {
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-3 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
};

const SIZES: Record<3 | 4 | 5, string> = {
  3: "(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw",
  4: "(min-width:1024px) 22vw, (min-width:640px) 30vw, 90vw",
  5: "(min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:640px) 30vw, 90vw",
};

/**
 * One column on mobile, up to 5 on a wide desktop. `priorityCount`
 * marks the first N images as LCP candidates — only use it above the fold.
 */
export function ProductGrid({
  products,
  priorityCount = 0,
  columns = 4,
  className,
  mobileSlider = false,
}: {
  products: Product[];
  priorityCount?: number;
  columns?: 3 | 4 | 5;
  className?: string;
  mobileSlider?: boolean;
}) {
  if (mobileSlider) return (
    <CategorySlider label="products" desktopGrid gridClassName={COLUMNS[columns]}>
      {products.map((product, index) => (
        <li key={product.id} className="flex w-full shrink-0 snap-start sm:w-auto">
          <ProductCard product={product} priority={index < priorityCount} sizes={SIZES[columns]} className="w-full" />
        </li>
      ))}
    </CategorySlider>
  );
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:gap-4",
        COLUMNS[columns],
        className,
      )}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < priorityCount}
          sizes={SIZES[columns]}
        />
      ))}
    </div>
  );
}

/** Horizontally scrollable row — used for carousels (spec §21, §35). */
export function ProductRail({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:gap-4 sm:px-8 lg:-mx-12 lg:px-12",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          className="w-full shrink-0 snap-start sm:w-[38vw] lg:w-[23%] xl:w-[19%]"
          sizes="(min-width:1280px) 19vw, (min-width:1024px) 23vw, (min-width:640px) 38vw, 90vw"
        />
      ))}
    </div>
  );
}
