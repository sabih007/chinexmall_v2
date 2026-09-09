"use client";

import { MessageCircle, ShoppingBag } from "lucide-react";
import { CartItem } from "@/components/cart/CartDrawer";
import { useStore } from "@/components/providers/StoreProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Primitives";
import { formatPrice, freeShippingProgress } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

/** Full cart page. Checkout itself lives at `/checkout`. */
export function CartClient() {
  const { lines, subtotal, savings, setQuantity, removeLine, hydrated } =
    useStore();

  if (!hydrated) {
    return (
      <div className="space-y-4 pb-24">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-card border border-line px-6 py-20 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <ShoppingBag size={22} strokeWidth={1.3} className="text-muted" />
        </div>
        <p className="text-[15px] font-medium">Your cart is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-[13px] text-muted">
          There is something in here for everyone — start with what is new this
          week.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop">Shop all</ButtonLink>
          <ButtonLink href="/new-arrivals" variant="secondary">
            New arrivals
          </ButtonLink>
        </div>
      </div>
    );
  }

  const shipping = freeShippingProgress(subtotal);

  const whatsappOrder = whatsappLink({
    message: [
      "Hi, I'd like to place this order:",
      ...lines.map(
        (l) =>
          `• ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} × ${l.quantity} — ${formatPrice(l.unitPrice * l.quantity)}`,
      ),
      `Subtotal: ${formatPrice(subtotal)}`,
    ].join("\n"),
  });

  return (
    <div className="grid gap-12 pb-24 lg:grid-cols-[1fr_360px] lg:gap-16">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map((line) => (
          <CartItem
            key={line.key}
            line={line}
            onQuantity={(q) => setQuantity(line.key, q)}
            onRemove={() => removeLine(line.key)}
          />
        ))}
      </ul>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-card border border-line p-6">
          <h2 className="text-[14px] font-semibold">
            Order summary
          </h2>

          <dl className="mt-6 space-y-3 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium tabular-nums">
                {formatPrice(subtotal)}
              </dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">You save</dt>
                <dd className="font-medium text-accent tabular-nums">
                  −{formatPrice(savings)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="tabular-nums">
                {shipping.qualified ? "Free" : "Calculated at checkout"}
              </dd>
            </div>
          </dl>

          {!shipping.qualified && (
            <div className="mt-5 rounded-card bg-sand px-4 py-3">
              <p className="text-[12px] text-ink/80">
                Add{" "}
                <strong className="font-semibold">
                  {formatPrice(shipping.remaining)}
                </strong>{" "}
                more for free delivery.
              </p>
              <div className="mt-2 h-[3px] w-full overflow-hidden bg-line">
                <div
                  className="h-full bg-ink transition-[width] duration-700"
                  style={{ width: `${Math.round(shipping.ratio * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-[13.5px] font-semibold">
              Total
            </span>
            <span className="text-[18px] font-semibold tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </div>

          <ButtonLink href="/checkout" full size="lg" className="mt-6">
            Proceed to checkout
          </ButtonLink>

          <a
            href={whatsappOrder}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint text-[13px] font-medium text-mint-ink transition-colors hover:bg-mint-deep"
          >
            <MessageCircle size={15} strokeWidth={1.6} />
            Order via WhatsApp
          </a>

          <ButtonLink
            href="/shop"
            variant="link"
            full
            className="mt-5 text-[12.5px] text-muted hover:text-brand"
          >
            Continue shopping
          </ButtonLink>
        </div>
      </aside>
    </div>
  );
}
