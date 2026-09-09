import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/CouponForm";
import { findCouponById } from "@/lib/admin/coupons-store";
import { couponToForm } from "@/lib/admin/coupon-form";
import { couponStatus, statusLabels } from "@/lib/coupons";
import { formatDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const coupon = await findCouponById(id);
  return { title: coupon ? `Edit ${coupon.code}` : "Coupon not found" };
}

export default async function EditCouponPage({ params }: PageProps) {
  const { id } = await params;
  const coupon = await findCouponById(id);
  if (!coupon) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/admin/coupons"
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          ← Coupons
        </Link>
        <h1 className="display mt-2 font-mono text-[1.5rem] tracking-wide">
          {coupon.code}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          {statusLabels[couponStatus(coupon)]} · created{" "}
          {formatDate(coupon.createdAt)} · redeemed {coupon.usedCount} time
          {coupon.usedCount === 1 ? "" : "s"}
        </p>
      </header>

      <CouponForm
        couponId={coupon.id}
        initialValues={couponToForm(coupon)}
        submitLabel="Save changes"
        usedCount={coupon.usedCount}
      />
    </div>
  );
}
