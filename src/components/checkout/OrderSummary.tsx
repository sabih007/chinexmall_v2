"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import { deliveryMethod } from "@/lib/orders";
import type {
  AppliedCoupon,
  Coupon,
  DeliveryMethodId,
  OrderTotals,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/** The shape both a live cart line and a placed order line collapse to. */
export interface SummaryLine {
  key: string;
  slug: string;
  name: string;
  image: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Order summary, shared by the checkout page and the confirmation page.
 *
 * On small screens it starts collapsed behind the total — the pattern every
 * checkout uses, because the form is what the customer came to fill in.
 */
export function OrderSummary({
  lines,
  totals,
  delivery,
  coupon,
  couponField,
  linkProducts = true,
  children,
}: {
  lines: SummaryLine[];
  totals: OrderTotals;
  delivery: DeliveryMethodId;
  /** Labels the discount row: a live coupon at checkout, or the one recorded
   *  on a placed order. */
  coupon?: Coupon | AppliedCoupon | null;
  /** The "Have a coupon?" row. Absent on the confirmation page. */
  couponField?: ReactNode;
  /** Off on the confirmation page, where the order is already placed. */
  linkProducts?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-paper">
      {/* Mobile disclosure */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 border-b border-line px-5 py-4 text-left lg:hidden"
      >
        <span className="flex items-center gap-2 text-[14px] font-medium">
          {open ? "Hide" : "Show"} order summary
          <ChevronDown
            size={15}
            strokeWidth={1.6}
            className={cn("transition-transform duration-300", open && "rotate-180")}
          />
        </span>
        <span className="text-[17px] font-semibold tabular-nums">
          {formatPrice(totals.total)}
        </span>
      </button>

      <div className={cn("lg:block", !open && "hidden")}>
        <div className="hidden border-b border-line px-6 py-4 lg:block">
          <h2 className="text-[16px] font-semibold">
            Order summary{" "}
            <span className="ml-1 font-normal text-muted tabular-nums">
              ({count})
            </span>
          </h2>
        </div>

        <ul className="divide-y divide-line px-5 sm:px-6">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-4 py-4">
              <ImageOrLink slug={line.slug} enabled={linkProducts}>
                <Image
                  src={line.image}
                  alt={line.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[12px] font-medium text-paper tabular-nums">
                  {line.quantity}
                </span>
              </ImageOrLink>

              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{line.name}</p>
                  {line.variantLabel && (
                    <p className="mt-0.5 text-[13px] text-muted">
                      {line.variantLabel}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-[15px] font-medium tabular-nums">
                  {formatPrice(line.unitPrice * line.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {couponField}

        <dl className="space-y-3 border-t border-line px-5 py-5 text-[15px] sm:px-6">
          <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
          {totals.savings > 0 && (
            <Row
              label="You save"
              value={`−${formatPrice(totals.savings)}`}
              accent
            />
          )}
          <Row
            label={deliveryMethod(delivery).label}
            value={totals.delivery === 0 ? "Free" : formatPrice(totals.delivery)}
          />
          {totals.discount > 0 && (
            <Row
              label={coupon ? `Coupon ${coupon.code}` : "Coupon"}
              value={`−${formatPrice(totals.discount)}`}
              accent
            />
          )}
          {totals.codFee > 0 && (
            <Row label="Cash handling" value={formatPrice(totals.codFee)} />
          )}
        </dl>

        <div className="flex items-baseline justify-between border-t border-line px-5 py-5 sm:px-6">
          <span className="text-[15px] font-semibold">
            Total
          </span>
          <span className="text-[19px] font-semibold tabular-nums">
            {formatPrice(totals.total)}
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}

function ImageOrLink({
  slug,
  enabled,
  children,
}: {
  slug: string;
  enabled: boolean;
  children: ReactNode;
}) {
  const className = "relative aspect-square w-16 shrink-0 rounded-lg bg-sand";
  return enabled ? (
    <Link href={`/product/${slug}`} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd
        className={cn(
          "font-medium tabular-nums",
          accent ? "text-accent" : undefined,
        )}
      >
        {value}
      </dd>
    </div>
  );
}
