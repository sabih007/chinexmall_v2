"use client";

import { Heart, MessageCircle, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { QuantityStepper } from "@/components/cart/CartDrawer";
import { useStore } from "@/components/providers/StoreProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { Rating, SpecRow } from "@/components/ui/Primitives";
import { defaultSelections, resolveVariant } from "@/lib/cart";
import { discountPercent, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import type { Product } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ProductGallery } from "./ProductGallery";
import { ProductVariants } from "./ProductVariants";

/**
 * Product page body (spec §26–§29). Owns variant selection so the gallery,
 * price, cart line and WhatsApp message all stay in sync.
 */
export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, closeCart, toggleWishlist, isWishlisted, hydrated } =
    useStore();

  const [selections, setSelections] = useState(() => defaultSelections(product));
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const resolved = useMemo(
    () => resolveVariant(product, selections),
    [product, selections],
  );

  const discount = discountPercent(resolved.unitPrice, resolved.compareAtPrice);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;
  const wished = hydrated && isWishlisted(product.slug);

  function selectVariant(optionId: string, value: string) {
    const next = { ...selections, [optionId]: value };
    setSelections(next);
    const { imageIndex: nextImage } = resolveVariant(product, next);
    setImageIndex(nextImage);
  }

  function add() {
    addToCart({ product, quantity, selections });
  }

  /** Skips the cart entirely and drops the customer into checkout (spec §28). */
  function buyNow() {
    addToCart({ product, quantity, selections });
    closeCart();
    router.push("/checkout");
  }

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery
            images={product.images}
            alt={product.name}
            activeIndex={imageIndex}
            onActiveIndexChange={setImageIndex}
          />
        </div>

        {/* Information */}
        <div className="lg:max-w-lg">
          <div className="flex flex-wrap items-center gap-2">
            {product.newArrival && <Badge tone="new">New</Badge>}
            {product.bestSeller && <Badge tone="best">Best seller</Badge>}
            {product.trending && <Badge tone="trending">Trending</Badge>}
            {discount > 0 && <Badge tone="sale">{discount}% off</Badge>}
          </div>

          <h1 className="display mt-5 text-[1.75rem] leading-[1.08] sm:text-[2.25rem]">
            {product.name}
          </h1>

          <div className="mt-3">
            <Rating value={product.rating} count={product.reviewCount} showValue />
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[22px] font-semibold tabular-nums">
              {formatPrice(resolved.unitPrice)}
            </span>
            {discount > 0 && resolved.compareAtPrice && (
              <>
                <span className="text-[15px] text-muted line-through tabular-nums">
                  {formatPrice(resolved.compareAtPrice)}
                </span>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12.5px] font-semibold text-accent">
                  Save{" "}
                  {formatPrice(resolved.compareAtPrice - resolved.unitPrice)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted">
            Inclusive of taxes. Delivery calculated at checkout.
          </p>

          <p className="mt-6 text-[14.5px] leading-relaxed text-muted">
            {product.description}
          </p>

          {/* Variants */}
          <div className="mt-9">
            <ProductVariants
              product={product}
              selections={selections}
              onChange={selectVariant}
            />
          </div>

          {/* Quantity + stock */}
          <div className="mt-8 flex items-center gap-4">
            <QuantityStepper
              value={quantity}
              max={Math.max(product.stock, 1)}
              onChange={(v) => setQuantity(Math.max(1, v))}
            />
            <span
              className={cn(
                "text-[12px]",
                soldOut ? "text-muted" : lowStock ? "text-accent" : "text-muted",
              )}
            >
              {soldOut
                ? "Currently out of stock"
                : lowStock
                  ? `Only ${product.stock} left`
                  : "In stock, ready to dispatch"}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={add}
                disabled={soldOut}
                variant="primary"
                size="lg"
                full
              >
                {soldOut ? "Sold out" : "Add to cart"}
              </Button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.slug)}
                aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                aria-pressed={wished}
                className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent"
              >
                <Heart
                  size={18}
                  strokeWidth={1.6}
                  className={cn(wished && "fill-accent text-accent")}
                />
              </button>
            </div>

            <Button
              onClick={buyNow}
              disabled={soldOut}
              variant="secondary"
              size="lg"
              full
            >
              Buy now
            </Button>

            <a
              href={whatsappLink({
                product,
                variantLabel: resolved.variantLabel,
                quantity,
              })}
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint text-[13px] font-medium text-mint-ink transition-colors hover:bg-mint-deep"
            >
              <MessageCircle size={15} strokeWidth={1.6} />
              Order via WhatsApp
            </a>
          </div>

          {/* Reassurance */}
          <ul className="mt-8 grid gap-3 rounded-card bg-sand p-5">
            {[
              { icon: ShieldCheck, text: "Brand new and factory sealed" },
              {
                icon: Truck,
                text: `Free delivery over ${formatPrice(site.freeShippingThreshold)}`,
              },
              { icon: RotateCcw, text: "7-day easy returns" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[13px] text-muted">
                <Icon size={16} strokeWidth={1.6} className="shrink-0 text-brand" />
                {text}
              </li>
            ))}
          </ul>

          {/* Tags: the operator's own labels, each a way back into the shop. */}
          {product.tags.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/shop?tag=${encodeURIComponent(tag)}`}
                    className="inline-block rounded-full bg-sand px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-sand-deep hover:text-ink"
                  >
                    {tag.replace(/-/g, " ")}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Details accordions */}
          <Accordion
            className="mt-8 border-t-0"
            defaultOpen="description"
            items={[
              {
                id: "description",
                title: "Description",
                content: <p>{product.description}</p>,
              },
              {
                id: "details",
                title: "Product details",
                content: (
                  <ul className="space-y-1.5">
                    {product.details.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span aria-hidden className="text-brand">
                          •
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                id: "included",
                title: "What's included",
                content: (
                  <ul className="space-y-1.5">
                    {product.whatsIncluded.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span aria-hidden className="text-brand">
                          •
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                id: "material",
                title: "Material",
                content: <p>{product.material}</p>,
              },
              {
                id: "size",
                title: "Size & dimensions",
                content: (
                  <dl>
                    <SpecRow label="Dimensions" value={product.dimensions} />
                    <SpecRow label="Weight" value={product.weight} />
                    <SpecRow label="SKU" value={product.sku} />
                  </dl>
                ),
              },
              {
                id: "shipping",
                title: "Shipping",
                content: <p>{product.shippingInfo}</p>,
              },
              {
                id: "returns",
                title: "Returns",
                content: (
                  <p>
                    Unused items in original packaging can be returned within 7
                    days of delivery. Faulty or incorrect items are collected and
                    replaced at our cost.
                  </p>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Sticky mobile add-to-cart (spec §41) */}
      <StickyAddToCart
        price={resolved.unitPrice}
        compareAtPrice={resolved.compareAtPrice}
        soldOut={soldOut}
        onAdd={add}
      />
    </>
  );
}

function StickyAddToCart({
  price,
  compareAtPrice,
  soldOut,
  onAdd,
}: {
  price: number;
  compareAtPrice?: number;
  soldOut: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-14 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tabular-nums">
            {formatPrice(price)}
          </p>
          {compareAtPrice && compareAtPrice > price && (
            <p className="text-[11.5px] text-muted line-through tabular-nums">
              {formatPrice(compareAtPrice)}
            </p>
          )}
        </div>
        <Button
          onClick={onAdd}
          disabled={soldOut}
          variant="primary"
          size="lg"
          className="flex-1"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
