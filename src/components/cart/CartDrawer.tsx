"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { formatPrice, freeShippingProgress } from "@/lib/format";
import type { CartLine, Product } from "@/lib/types";

/** Slide-out cart (spec §30), including a "you may also like" rail. */
export function CartDrawer() {
  const {
    cartOpen,
    closeCart,
    lines,
    subtotal,
    savings,
    count,
    setQuantity,
    removeLine,
  } = useStore();

  const shipping = freeShippingProgress(subtotal);

  return (
    <Drawer
      open={cartOpen}
      onClose={closeCart}
      side="right"
      labelledBy="cart-title"
      headerSlot={
        <h2
          id="cart-title"
          className="text-[14px] font-semibold"
        >
          Your cart{" "}
          <span className="ml-1 font-normal text-muted tabular-nums">
            ({count})
          </span>
        </h2>
      }
      footer={
        lines.length > 0 ? (
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold">Subtotal</span>
              <span className="text-[15px] font-semibold tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>

            {savings > 0 && (
              <p className="-mt-2 text-right text-[11px] text-accent">
                You are saving {formatPrice(savings)}
              </p>
            )}

            <p className="text-[11px] text-muted">
              Taxes and delivery calculated at checkout.
            </p>

            <ButtonLink
              href="/checkout"
              variant="primary"
              size="lg"
              full
              onClick={closeCart}
            >
              Checkout
            </ButtonLink>
            <Button variant="link" full onClick={closeCart} className="text-[12.5px] text-muted hover:text-brand">
              Continue shopping
            </Button>
          </div>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <EmptyCart onClose={closeCart} />
      ) : (
        <div className="flex flex-col">
          <FreeShippingMeter {...shipping} />

          <ul className="divide-y divide-line px-5">
            {lines.map((line) => (
              <CartItem
                key={line.key}
                line={line}
                onQuantity={(q) => setQuantity(line.key, q)}
                onRemove={() => removeLine(line.key)}
              />
            ))}
          </ul>

          <CartRecommendations excludeSlugs={lines.map((l) => l.slug)} />
        </div>
      )}
    </Drawer>
  );
}

function FreeShippingMeter({
  remaining,
  qualified,
  ratio,
}: {
  remaining: number;
  qualified: boolean;
  ratio: number;
}) {
  return (
    <div className="border-b border-line bg-sand px-5 py-4">
      <p className="text-[11.5px] text-ink/80">
        {qualified ? (
          <>
            Nice — your order ships <strong className="font-semibold">free</strong>.
          </>
        ) : (
          <>
            You are{" "}
            <strong className="font-semibold">{formatPrice(remaining)}</strong>{" "}
            away from free delivery.
          </>
        )}
      </p>
      <div className="mt-2.5 h-[3px] w-full overflow-hidden bg-line">
        <div
          className="h-full bg-ink transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function CartItem({
  line,
  onQuantity,
  onRemove,
  compact,
}: {
  line: CartLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/product/${line.slug}`}
        className="relative aspect-square w-[76px] shrink-0 overflow-hidden rounded-lg bg-sand"
      >
        <Image
          src={line.image}
          alt={line.name}
          fill
          sizes="76px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/product/${line.slug}`}
              className="block truncate text-[13px] font-medium hover:text-muted"
            >
              {line.name}
            </Link>
            {line.variantLabel && (
              <p className="mt-0.5 text-[11.5px] text-muted">
                {line.variantLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${line.name}`}
            className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center text-muted transition-colors hover:text-ink"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <QuantityStepper
            value={line.quantity}
            max={line.maxQuantity}
            onChange={onQuantity}
            compact={compact}
          />
          <div className="text-right">
            <p className="text-[13px] font-semibold tabular-nums">
              {formatPrice(line.unitPrice * line.quantity)}
            </p>
            {line.compareAtPrice && line.compareAtPrice > line.unitPrice && (
              <p className="text-[11px] text-muted line-through tabular-nums">
                {formatPrice(line.compareAtPrice * line.quantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  compact,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  const size = compact ? "h-8 w-8" : "h-9 w-9";
  return (
    <div className="inline-flex items-center rounded-full border border-line">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
        className={`${size} flex items-center justify-center text-muted transition-colors hover:text-ink`}
      >
        <Minus size={13} strokeWidth={1.8} />
      </button>
      <span
        aria-live="polite"
        className="min-w-7 text-center text-[12px] font-medium tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`${size} flex items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-30`}
      >
        <Plus size={13} strokeWidth={1.8} />
      </button>
    </div>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <ShoppingBag size={22} strokeWidth={1.3} className="text-muted" />
      </div>
      <div>
        <p className="text-[15px] font-medium">Your cart is empty</p>
        <p className="mt-1.5 text-[13px] text-muted">
          There is something in here for everyone. Have a look around.
        </p>
      </div>
      <ButtonLink href="/shop" variant="primary" onClick={onClose}>
        Start shopping
      </ButtonLink>
    </div>
  );
}

/** Cross-sell rail inside the drawer (spec §30). */
function CartRecommendations({ excludeSlugs }: { excludeSlugs: string[] }) {
  const { addToCart } = useStore();
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "4" });
    for (const slug of excludeSlugs) params.append("exclude", slug);

    fetch(`/api/recommendations?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: Product[] }) => setItems(data.items ?? []))
      .catch(() => {
        /* offline or aborted — the rail simply does not render */
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeSlugs.join(",")]);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-line px-5 py-6">
      <p className="eyebrow mb-4 text-muted">You may also like</p>
      <ul className="space-y-4">
        {items.slice(0, 3).map((product) => (
          <li key={product.id} className="flex items-center gap-3">
            <Link
              href={`/product/${product.slug}`}
              className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-lg bg-sand"
            >
              <Image
                src={product.thumbnail}
                alt={product.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${product.slug}`}
                className="block truncate text-[12.5px] font-medium hover:text-muted"
              >
                {product.name}
              </Link>
              <p className="text-[12px] text-muted tabular-nums">
                {formatPrice(product.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => addToCart({ product })}
              className="shrink-0 rounded-full bg-mint px-3.5 py-1.5 text-[11.5px] font-medium text-mint-ink transition-colors hover:bg-mint-deep"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
