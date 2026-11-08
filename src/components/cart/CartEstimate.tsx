import { orderTotals } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/types";

/** Shares checkout's standard-delivery and COD calculation. Coupons apply at checkout. */
export function CartEstimate({ lines }: { lines: CartLine[] }) {
  const totals = orderTotals(lines, "standard", "cod");
  return (
    <div>
      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-3"><dt className="text-ink-soft">Standard delivery estimate</dt><dd className="font-medium tabular-nums">{totals.delivery === 0 ? "Free" : formatPrice(totals.delivery)}</dd></div>
        {totals.codFee > 0 && <div className="flex justify-between gap-3"><dt>Cash on delivery fee</dt><dd>{formatPrice(totals.codFee)}</dd></div>}
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3"><dt className="text-sm font-semibold">Estimated total</dt><dd className="text-lg font-semibold tabular-nums text-brand-deep">{formatPrice(totals.total)}</dd></div>
      </dl>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">Includes standard delivery and cash on delivery. Coupons and other delivery options apply at checkout.</p>
    </div>
  );
}
