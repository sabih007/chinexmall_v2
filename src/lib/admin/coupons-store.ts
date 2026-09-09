import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Coupon } from "@/lib/types";
import * as db from "./coupons.db";
import * as file from "./coupons.file";

/* -------------------------------------------------------------------------- */
/*  Coupon store                                                               */
/*                                                                             */
/*  Postgres when Supabase is configured, `data/coupons.json` when it is not.  */
/*  Redemptions are counted by whichever backend is live, and both refuse the   */
/*  last use of a limited code to two customers at once.                       */
/* -------------------------------------------------------------------------- */

const backend = () => (isSupabaseConfigured() ? db : file);

export const newCouponId = file.newCouponId;

export function listCoupons(): Promise<Coupon[]> {
  return backend().listCoupons();
}

export function findCouponById(id: string): Promise<Coupon | null> {
  return backend().findCouponById(id);
}

export function findCouponByCode(code: string): Promise<Coupon | null> {
  return backend().findCouponByCode(code);
}

export function saveCoupon(coupon: Coupon): Promise<void> {
  return backend().saveCoupon(coupon);
}

export function deleteCoupon(id: string): Promise<void> {
  return backend().deleteCoupon(id);
}

/** False when the coupon ran out while the customer was on the checkout. */
export function recordRedemption(id: string): Promise<boolean> {
  return backend().recordRedemption(id);
}
