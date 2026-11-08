"use client";

import { Heart, ShoppingBasket } from "lucide-react";
import { StoreImage as Image } from "@/components/common/StoreImage";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Primitives";
import { discountPercent, formatPrice } from "@/lib/format";
import { BLUR_DATA_URL } from "@/lib/images";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The storefront's workhorse (spec §17, §18).
 *
 * A bordered white card: category, wishlist heart, image, the first variant
 * option as pills, price with its saving, title, rating, and one full-width
 * action. Products with options send you to the page to choose them; simple
 * products add straight to the cart.
 */
export function ProductCard({
  product,
  priority,
  sizes = "(min-width:1280px) 20vw, (min-width:768px) 30vw, 90vw",
  className,
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const { addToCart, toggleWishlist, isWishlisted, hydrated } = useStore();
  const [adding, setAdding] = useState(false);
  const [loadedSecondary, setLoadedSecondary] = useState("");

  const discount = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const secondImage = product.images[1];
  const wished = hydrated && isWishlisted(product.slug);
  const hasOptions = product.variants.length > 0;
  const optionPills = product.variants[0]?.values.slice(0, 3) ?? [];

  function quickAdd() {
    if (soldOut) return;
    setAdding(true);
    addToCart({ product });
    window.setTimeout(() => setAdding(false), 700);
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-card border border-line bg-paper p-3.5 transition-shadow duration-300 hover:shadow-card-hover sm:p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[13px] capitalize text-muted">
          {product.productType}
        </span>
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-label={
            wished
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          aria-pressed={wished}
          className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-accent"
        >
          <Heart
            size={16}
            strokeWidth={1.6}
            className={cn(wished && "fill-accent text-accent")}
          />
        </button>
      </div>

      <Link
        href={`/product/${product.slug}`}
        className="relative mt-2 block overflow-hidden rounded-[10px] bg-sand"
        aria-label={product.name}
      >
        <div className="relative aspect-square w-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes={sizes}
            priority={priority}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className={cn(
              "object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              "motion-safe:group-hover:scale-[1.03]",
            )}
          />
          {secondImage && (
            <Image
              src={secondImage}
              alt=""
              aria-hidden
              fill
              sizes={sizes}
              loading="lazy"
              onLoad={() => setLoadedSecondary(secondImage)}
              data-ready={loadedSecondary === secondImage}
              className="product-card-secondary scale-[1.02] object-cover opacity-0 transition-all duration-500"
            />
          )}
        </div>

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <Badge tone="soldout">Sold out</Badge>
          ) : (
            <>
              {product.newArrival && <Badge tone="new">New</Badge>}
              {product.bestSeller && !product.newArrival && (
                <Badge tone="best">Best seller</Badge>
              )}
              {product.trending && !product.newArrival && !product.bestSeller && (
                <Badge tone="trending">Trending</Badge>
              )}
            </>
          )}
        </div>
      </Link>

      {/* Reserved height even when there are no options, so prices, titles and
          buttons line up across a row of mixed products. */}
      <ul className="mt-3.5 flex min-h-[22px] flex-wrap gap-1.5">
        {optionPills.length > 1 &&
          optionPills.map((value) => (
            <li
              key={value.value}
              className="rounded-full border border-line px-2 py-[3px] text-[12px] leading-none text-muted"
            >
              {value.label}
            </li>
          ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[16px] font-semibold tabular-nums">
          {formatPrice(product.price)}
        </span>
        {discount > 0 && product.compareAtPrice && (
          <>
            <span className="text-[14px] text-muted line-through tabular-nums">
              {formatPrice(product.compareAtPrice)}
            </span>
            <span className="rounded-full bg-accent px-1.5 py-[2px] text-[12px] font-semibold leading-none text-paper tabular-nums">
              −{discount}%
            </span>
          </>
        )}
      </div>

      <h3 className="mt-2 text-[15px] font-medium leading-snug">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 transition-colors hover:text-brand"
        >
          {product.name}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">{product.shortDescription}</p>

      {product.reviewCount > 0 && <Rating
        value={product.rating}
        size={12}
        showValue
        className="mt-2 mb-4"
      />}

      <div className="mt-auto pt-4">
        {hasOptions ? (
          <Link
            href={`/product/${product.slug}`}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-[14px] font-medium text-paper transition-colors hover:bg-brand-hover",
              soldOut && "pointer-events-none opacity-50",
            )}
          >
            <ShoppingBasket size={14} strokeWidth={1.7} />
            {soldOut ? "Sold out" : "Select options"}
          </Link>
        ) : (
          <button
            type="button"
            onClick={quickAdd}
            disabled={soldOut}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-[14px] font-medium text-paper transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBasket size={14} strokeWidth={1.7} />
            {soldOut ? "Sold out" : adding ? "Added" : "Add to cart"}
          </button>
        )}
      </div>
    </article>
  );
}
