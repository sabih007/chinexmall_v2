import { CheckCircle2, Pencil, TicketPlus } from "lucide-react";
import Link from "next/link";
import { DeleteCouponButton } from "@/components/admin/DeleteCouponButton";
import {
  couponStatus,
  describeCoupon,
  statusLabels,
  type CouponStatus,
} from "@/lib/coupons";
import { formatDate, formatPrice } from "@/lib/format";
import { getCoupons } from "@/lib/repository";

export const metadata = { title: "Coupons" };

const statusTones: Record<CouponStatus, string> = {
  active: "bg-mint text-mint-ink",
  paused: "bg-sand text-muted",
  scheduled: "bg-tint-blue text-ink-soft",
  expired: "bg-sand text-muted",
  "used-up": "bg-gold-soft text-ink",
};

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; removed?: string }>;
}) {
  const { saved, removed } = await searchParams;
  const coupons = await getCoupons();
  const live = coupons.filter((c) => couponStatus(c) === "active").length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.5rem]">Coupons</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {coupons.length === 0
              ? "No coupons yet."
              : `${coupons.length} coupon${coupons.length === 1 ? "" : "s"} · ${live} usable right now`}
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover"
        >
          <TicketPlus size={16} strokeWidth={1.8} />
          New coupon
        </Link>
      </header>

      {(saved || removed) && (
        <p className="flex items-center gap-2.5 rounded-[10px] border border-mint-deep bg-mint px-4 py-3 text-[13px] text-mint-ink">
          <CheckCircle2 size={16} strokeWidth={1.8} className="shrink-0" />
          {saved ? (
            <>
              Saved <span className="font-mono font-medium">{saved}</span>.
              Customers can use it at checkout straight away.
            </>
          ) : (
            "Coupon deleted."
          )}
        </p>
      )}

      {coupons.length === 0 ? (
        <div className="rounded-tile border border-dashed border-line bg-paper px-5 py-14 text-center">
          <p className="text-[13.5px] font-medium">Nothing to hand out yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted">
            Create a code and customers can enter it at checkout — a percentage
            off, a fixed amount, or free delivery.
          </p>
          <Link
            href="/admin/coupons/new"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover"
          >
            <TicketPlus size={16} strokeWidth={1.8} />
            Create the first one
          </Link>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-tile border border-line bg-paper shadow-card">
          {coupons.map((coupon) => {
            const status = couponStatus(coupon);

            return (
              <li
                key={coupon.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 last:border-0 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/coupons/${coupon.id}`}
                      className="font-mono text-[13.5px] font-semibold tracking-wide hover:text-brand"
                    >
                      {coupon.code}
                    </Link>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${statusTones[status]}`}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px] text-muted">
                    {describeCoupon(coupon)}
                    {coupon.minSubtotal > 0 &&
                      ` · over ${formatPrice(coupon.minSubtotal)}`}
                    {coupon.maxDiscount != null &&
                      ` · max ${formatPrice(coupon.maxDiscount)}`}
                    {coupon.expiresAt && ` · until ${formatDate(coupon.expiresAt)}`}
                  </p>
                </div>

                <div className="w-24 shrink-0 text-right">
                  <p className="text-[13px] font-medium tabular-nums">
                    {coupon.usedCount}
                    {coupon.usageLimit != null && ` / ${coupon.usageLimit}`}
                  </p>
                  <p className="text-[11.5px] text-muted">
                    {coupon.usageLimit != null ? "used" : "redeemed"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <Link
                    href={`/admin/coupons/${coupon.id}`}
                    aria-label={`Edit ${coupon.code}`}
                    title={`Edit ${coupon.code}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
                  >
                    <Pencil size={15} strokeWidth={1.7} />
                  </Link>
                  <DeleteCouponButton couponId={coupon.id} code={coupon.code} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[12px] leading-relaxed text-muted">
        Customers enter a code in the order summary at checkout. Every code is
        re-checked when the order is placed, so a coupon that expires or runs out
        mid-checkout is refused rather than honoured.
      </p>
    </div>
  );
}
