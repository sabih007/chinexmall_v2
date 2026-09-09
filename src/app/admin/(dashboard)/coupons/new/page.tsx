import Link from "next/link";
import { CouponForm } from "@/components/admin/CouponForm";

export const metadata = { title: "New coupon" };

export default function NewCouponPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/admin/coupons"
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          ← Coupons
        </Link>
        <h1 className="display mt-2 text-[1.5rem]">New coupon</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Customers can use it at checkout as soon as you save.
        </p>
      </header>

      <CouponForm submitLabel="Create coupon" />
    </div>
  );
}
