"use client";

import { AlertCircle, Loader2, Tag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { describeCoupon } from "@/lib/coupons";
import { formatPrice } from "@/lib/format";
import type {
  CartLine,
  Coupon,
  DeliveryMethodId,
  PaymentMethodId,
} from "@/lib/types";

/**
 * "Have a coupon?" in the order summary.
 *
 * The code is checked by `/api/coupons`, which re-prices the basket server-side
 * and hands back the whole coupon — the checkout then keeps the total accurate
 * on its own as the customer switches delivery or payment method.
 */
export function CouponField({
  lines,
  delivery,
  payment,
  coupon,
  problem,
  discount,
  onApply,
  onRemove,
}: {
  lines: CartLine[];
  delivery: DeliveryMethodId;
  payment: PaymentMethodId;
  coupon: Coupon | null;
  /** Why an applied coupon is not discounting this basket right now. */
  problem?: string | null;
  discount: number;
  onApply: (coupon: Coupon) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    if (checking) return;

    const wanted = code.trim();
    if (!wanted) {
      setError("Enter a coupon code.");
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: wanted,
          delivery,
          payment,
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            selections: l.selections,
          })),
        }),
      });

      const data = (await response.json()) as {
        coupon?: Coupon;
        message?: string;
      };

      if (!response.ok || !data.coupon) {
        setError(data.message ?? "That coupon could not be applied.");
        return;
      }

      onApply(data.coupon);
      setCode("");
    } catch {
      setError("We could not check that code. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (coupon) {
    return (
      <div className="border-t border-line px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3 rounded-card bg-mint px-3.5 py-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <Tag
              size={15}
              strokeWidth={1.7}
              className="mt-0.5 shrink-0 text-mint-ink"
            />
            <div className="min-w-0">
              <p className="font-mono text-[12.5px] font-semibold tracking-wide text-mint-ink">
                {coupon.code}
              </p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-mint-ink/80">
                {problem
                  ? problem
                  : `${coupon.description || describeCoupon(coupon)} — saving ${formatPrice(discount)}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove coupon ${coupon.code}`}
            className="shrink-0 rounded-full p-1 text-mint-ink/70 transition-colors hover:bg-mint-deep hover:text-mint-ink"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-line px-5 py-4 sm:px-6">
      {/* A nested <form> is invalid inside the checkout form, so this is a plain
          row whose button submits nothing — Enter is handled on the input. */}
      <label
        htmlFor="coupon-code"
        className="text-[12px] font-medium text-ink-soft"
      >
        Have a coupon?
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="coupon-code"
          name="coupon-code"
          value={code}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Enter code"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") apply(event);
          }}
          className="h-11 w-full rounded-full border border-line bg-paper px-4 font-mono text-[13px] uppercase tracking-wide outline-none transition-colors placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:border-brand"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={apply}
          disabled={checking}
          className="shrink-0"
        >
          {checking ? (
            <Loader2 size={14} strokeWidth={2} className="animate-spin" />
          ) : null}
          Apply
        </Button>
      </div>

      {error && (
        <p
          id="coupon-error"
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-accent"
        >
          <AlertCircle size={13} strokeWidth={1.8} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
