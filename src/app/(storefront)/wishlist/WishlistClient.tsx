"use client";

import { Heart } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Primitives";
import type { Product } from "@/lib/types";

/**
 * The wishlist lives in localStorage, so the full catalogue is passed in from
 * the server and filtered on the client once hydration completes.
 */
export function WishlistClient({ products }: { products: Product[] }) {
  const { wishlist, hydrated } = useStore();

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const saved = wishlist
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));

  if (saved.length === 0) {
    return (
      <div className="rounded-card border border-line px-6 py-20 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sand">
          <Heart size={22} strokeWidth={1.3} className="text-muted" />
        </div>
        <p className="text-[15px] font-medium">Nothing saved yet</p>
        <p className="mx-auto mt-2 max-w-sm text-[13px] text-muted">
          Tap the heart on any product to keep it here while you decide.
        </p>
        <ButtonLink href="/shop" variant="primary" className="mt-7">
          Start browsing
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <p className="mb-8 inline-block rounded-full bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand tabular-nums">
        {saved.length} saved item{saved.length === 1 ? "" : "s"}
      </p>
      <ProductGrid products={saved} />
    </>
  );
}
