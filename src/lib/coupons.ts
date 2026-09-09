/**
 * Coupon rules: what a code is worth, and when it may be used.
 *
 * Pure and isomorphic, exactly like `src/lib/orders.ts`. The checkout uses it
 * to price the basket the moment a code is accepted, and `/api/coupons` and
 * `/api/orders` use the very same functions to decide whether to honour it —
 * so what the customer is quoted and what they are charged cannot drift.
 */

import { formatPrice } from "./format";
import type { AppliedCoupon, Coupon, CouponType } from "./types";

/** Codes are stored and compared uppercase, with no spaces. */
export function normaliseCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export const COUPON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,23}$/;

/** Ambiguous characters are left out — these get read down a phone line. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCouponCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/* -------------------------------------------------------------------------- */
/*  Status                                                                    */
/* -------------------------------------------------------------------------- */

export type CouponStatus =
  | "active"
  | "paused"
  | "scheduled"
  | "expired"
  | "used-up";

/** What the dashboard shows in the status column. */
export function couponStatus(coupon: Coupon, now = Date.now()): CouponStatus {
  if (!coupon.active) return "paused";
  if (coupon.startsAt && Date.parse(coupon.startsAt) > now) return "scheduled";
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= now) return "expired";
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    return "used-up";
  return "active";
}

export const statusLabels: Record<CouponStatus, string> = {
  active: "Active",
  paused: "Paused",
  scheduled: "Scheduled",
  expired: "Expired",
  "used-up": "Used up",
};

/* -------------------------------------------------------------------------- */
/*  Eligibility                                                               */
/* -------------------------------------------------------------------------- */

export interface CouponContext {
  subtotal: number;
  /** The delivery fee before any discount — what free-shipping codes waive. */
  deliveryFee: number;
  now?: number;
}

/**
 * Why this basket cannot use this coupon, phrased for the customer, or `null`
 * when it can. Both the API and the checkout show the string as-is.
 */
export function couponProblem(
  coupon: Coupon,
  context: CouponContext,
): string | null {
  const now = context.now ?? Date.now();

  switch (couponStatus(coupon, now)) {
    case "paused":
      return "That coupon is no longer available.";
    case "scheduled":
      return "That coupon cannot be used yet.";
    case "expired":
      return "That coupon has expired.";
    case "used-up":
      return "That coupon has reached its limit.";
  }

  if (context.subtotal < coupon.minSubtotal) {
    return `Spend ${formatPrice(coupon.minSubtotal)} to use this coupon.`;
  }

  if (coupon.type === "free-shipping" && context.deliveryFee <= 0) {
    return "Your delivery is already free.";
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Money                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * What this coupon takes off, in rupees. Never more than the basket is worth,
 * so a large fixed-amount code cannot drive a total below the delivery fee.
 */
export function couponDiscount(
  coupon: Coupon,
  context: CouponContext,
): number {
  if (couponProblem(coupon, context)) return 0;

  switch (coupon.type) {
    case "percentage": {
      const raw = Math.round((context.subtotal * coupon.value) / 100);
      const capped =
        coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
      return Math.min(capped, context.subtotal);
    }
    case "fixed":
      return Math.min(coupon.value, context.subtotal);
    case "free-shipping":
      return context.deliveryFee;
  }
}

/** The record kept on the order, with the discount already resolved. */
export function applyCoupon(
  coupon: Coupon,
  context: CouponContext,
): AppliedCoupon {
  return {
    code: coupon.code,
    description: coupon.description || describeCoupon(coupon),
    type: coupon.type,
    amount: couponDiscount(coupon, context),
  };
}

/* -------------------------------------------------------------------------- */
/*  Copy                                                                      */
/* -------------------------------------------------------------------------- */

/** "20% off", "Rs. 500 off", "Free delivery" — used wherever a coupon is listed. */
export function describeCoupon(coupon: Pick<Coupon, "type" | "value">): string {
  switch (coupon.type) {
    case "percentage":
      return `${coupon.value}% off`;
    case "fixed":
      return `${formatPrice(coupon.value)} off`;
    case "free-shipping":
      return "Free delivery";
  }
}

export const couponTypeLabels: Record<CouponType, string> = {
  percentage: "Percentage off",
  fixed: "Fixed amount off",
  "free-shipping": "Free delivery",
};
