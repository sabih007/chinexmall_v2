import "server-only";

import { normaliseCouponCode } from "@/lib/coupons";
import type { Coupon } from "@/lib/types";
import { createJsonStore } from "@/lib/json-store";

/**
 * Where coupons live when the store runs on files: `data/coupons.json`, keyed
 * by id. `coupons.db.ts` is the same contract against Postgres.
 *
 * Redemptions are counted here too — `recordRedemption` runs inside the store's
 * lock, so two customers checking out at the same moment cannot both slip past
 * the last remaining use of a limited code.
 */

export interface CouponBook {
  version: 1;
  coupons: Record<string, Coupon>;
  updatedAt: string | null;
}

const EMPTY: CouponBook = { version: 1, coupons: {}, updatedAt: null };

export function newCouponId(): string {
  return `cpn_${Date.now().toString(36)}${Math.floor(Math.random() * 1296)
    .toString(36)
    .padStart(2, "0")}`;
}

function isCoupon(value: unknown): value is Coupon {
  const c = value as Partial<Coupon> | null;
  return (
    !!c &&
    typeof c === "object" &&
    typeof c.id === "string" &&
    typeof c.code === "string" &&
    typeof c.value === "number" &&
    (c.type === "percentage" ||
      c.type === "fixed" ||
      c.type === "free-shipping")
  );
}

const store = createJsonStore<CouponBook>("coupons.json", EMPTY, (parsed) => {
  const raw = (parsed ?? {}) as Partial<CouponBook>;
  const coupons: Record<string, Coupon> = {};
  for (const [id, coupon] of Object.entries(raw.coupons ?? {})) {
    if (isCoupon(coupon)) coupons[id] = coupon;
  }
  return { version: 1, coupons, updatedAt: raw.updatedAt ?? null };
});

export async function listCoupons(): Promise<Coupon[]> {
  const { coupons } = await store.read();
  return Object.values(coupons).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export async function findCouponById(id: string): Promise<Coupon | null> {
  const { coupons } = await store.read();
  return coupons[id] ?? null;
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const wanted = normaliseCouponCode(code);
  if (!wanted) return null;
  const { coupons } = await store.read();
  return Object.values(coupons).find((c) => c.code === wanted) ?? null;
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  await store.mutate((book) => {
    book.coupons[coupon.id] = coupon;
    book.updatedAt = new Date().toISOString();
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  await store.mutate((book) => {
    delete book.coupons[id];
    book.updatedAt = new Date().toISOString();
  });
}

/**
 * Counts one redemption, refusing it if the coupon ran out while the customer
 * was on the checkout. Returns false when the order should not honour it.
 */
export async function recordRedemption(id: string): Promise<boolean> {
  return store.mutate((book) => {
    const coupon = book.coupons[id];
    if (!coupon) return false;
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
      return false;

    coupon.usedCount += 1;
    book.updatedAt = new Date().toISOString();
    return true;
  });
}
