import "server-only";

import { normaliseCouponCode } from "@/lib/coupons";
import { requireSupabase } from "@/lib/supabase/client";
import { ensure, fetchAll } from "@/lib/supabase/query";
import { fromCoupon, toCoupon } from "@/lib/supabase/rows";
import type { Coupon } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Coupons — the Postgres backend                                             */
/* -------------------------------------------------------------------------- */

const TABLE = "coupons";

export async function listCoupons(): Promise<Coupon[]> {
  const rows = await fetchAll(() =>
    requireSupabase()
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false }),
  );

  return rows.map(toCoupon);
}

export async function findCouponById(id: string): Promise<Coupon | null> {
  const { data, error } = await requireSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  ensure(error);
  return data ? toCoupon(data) : null;
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const wanted = normaliseCouponCode(code);
  if (!wanted) return null;

  const { data, error } = await requireSupabase()
    .from(TABLE)
    .select("*")
    .eq("code", wanted)
    .maybeSingle();

  ensure(error);
  return data ? toCoupon(data) : null;
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  const { error } = await requireSupabase().from(TABLE).upsert(fromCoupon(coupon));
  ensure(error);
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await requireSupabase().from(TABLE).delete().eq("id", id);
  ensure(error);
}

/**
 * Counts one redemption, refusing it if the coupon ran out while the customer
 * was on the checkout.
 *
 * The check and the increment are one statement inside `redeem_coupon()` (see
 * `supabase/schema.sql`), so two customers spending the last use of a limited
 * code at the same moment cannot both be let through.
 */
export async function recordRedemption(id: string): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc("redeem_coupon", {
    coupon_id: id,
  });

  ensure(error);
  return data === true;
}

/* -------------------------------------------------------------------------- */
/*  Import                                                                    */
/* -------------------------------------------------------------------------- */

export async function importCoupons(coupons: Coupon[]): Promise<number> {
  if (coupons.length === 0) return 0;

  const { error } = await requireSupabase()
    .from(TABLE)
    .upsert(coupons.map(fromCoupon), { onConflict: "id", ignoreDuplicates: true });

  ensure(error);
  return coupons.length;
}
