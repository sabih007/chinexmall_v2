/**
 * The shape of the coupon form, and the rules that turn it into a `Coupon`.
 *
 * Isomorphic like `product-form.ts` — the dashboard form and the Server Action
 * validate with the same functions.
 */

import { COUPON_CODE_PATTERN, normaliseCouponCode } from "@/lib/coupons";
import type { Coupon, CouponType } from "@/lib/types";

export interface CouponFormValues {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  minSubtotal: string;
  maxDiscount: string;
  /** `YYYY-MM-DD`, straight from `<input type="date">`. */
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  active: boolean;
}

export type CouponFormField = keyof CouponFormValues;
export type CouponFormErrors = Partial<Record<CouponFormField, string>>;

export const emptyCouponForm: CouponFormValues = {
  code: "",
  description: "",
  type: "percentage",
  value: "",
  minSubtotal: "0",
  maxDiscount: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  active: true,
};

/* -------------------------------------------------------------------------- */
/*  Dates                                                                     */
/*                                                                            */
/*  A date input carries a day, not an instant. A start date opens at         */
/*  midnight and an end date runs to the last moment of that day, so a coupon  */
/*  "expiring on the 31st" is usable all through the 31st. Both conversions    */
/*  use the server's timezone, in both directions.                            */
/* -------------------------------------------------------------------------- */

function startOfDay(date: string): string | undefined {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function endOfDay(date: string): string | undefined {
  if (!date) return undefined;
  const parsed = new Date(`${date}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function toDateInput(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* -------------------------------------------------------------------------- */

export function couponToForm(coupon: Coupon): CouponFormValues {
  return {
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.type === "free-shipping" ? "" : String(coupon.value),
    minSubtotal: String(coupon.minSubtotal),
    maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
    startsAt: toDateInput(coupon.startsAt),
    expiresAt: toDateInput(coupon.expiresAt),
    usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
    active: coupon.active,
  };
}

export function readCouponForm(formData: FormData): CouponFormValues {
  const values: CouponFormValues = { ...emptyCouponForm };

  for (const key of Object.keys(values) as CouponFormField[]) {
    const raw = formData.get(key);
    if (typeof values[key] === "boolean") {
      (values[key] as boolean) = raw === "on" || raw === "true";
    } else if (typeof raw === "string") {
      (values[key] as string) = raw;
    }
  }

  if (!isCouponType(values.type)) values.type = "percentage";
  return values;
}

function isCouponType(value: string): value is CouponType {
  return (
    value === "percentage" || value === "fixed" || value === "free-shipping"
  );
}

function toNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateCouponForm(
  values: CouponFormValues,
  context: { takenCodes?: string[] } = {},
): CouponFormErrors {
  const errors: CouponFormErrors = {};

  const code = normaliseCouponCode(values.code);
  if (!code) errors.code = "Give the coupon a code.";
  else if (!COUPON_CODE_PATTERN.test(code))
    errors.code =
      "Use 3–24 letters, numbers, hyphens or underscores, starting with a letter or number.";
  else if (context.takenCodes?.includes(code))
    errors.code = "Another coupon already uses that code.";

  if (values.description.trim().length > 80)
    errors.description = "Keep the description under 80 characters.";

  const value = toNumber(values.value);
  if (values.type === "percentage") {
    if (value === null) errors.value = "Enter a percentage.";
    else if (value <= 0 || value > 100)
      errors.value = "A percentage is between 1 and 100.";
  } else if (values.type === "fixed") {
    if (value === null) errors.value = "Enter an amount.";
    else if (value <= 0) errors.value = "The amount must be more than zero.";
  }

  const minSubtotal = toNumber(values.minSubtotal);
  if (values.minSubtotal.trim() && minSubtotal === null)
    errors.minSubtotal = "Enter a number, or leave it empty.";
  else if (minSubtotal !== null && minSubtotal < 0)
    errors.minSubtotal = "A minimum cannot be negative.";

  const maxDiscount = toNumber(values.maxDiscount);
  if (values.maxDiscount.trim()) {
    if (maxDiscount === null) errors.maxDiscount = "Enter a number, or leave it empty.";
    else if (maxDiscount <= 0) errors.maxDiscount = "A cap must be more than zero.";
    else if (values.type !== "percentage")
      errors.maxDiscount = "A cap only applies to a percentage coupon.";
  }

  const usageLimit = toNumber(values.usageLimit);
  if (values.usageLimit.trim()) {
    if (usageLimit === null || !Number.isInteger(usageLimit))
      errors.usageLimit = "Enter a whole number, or leave it empty.";
    else if (usageLimit < 1) errors.usageLimit = "A limit is at least one use.";
  }

  const starts = startOfDay(values.startsAt.trim());
  const expires = endOfDay(values.expiresAt.trim());
  if (values.startsAt.trim() && !starts) errors.startsAt = "That is not a date.";
  if (values.expiresAt.trim() && !expires) errors.expiresAt = "That is not a date.";
  if (starts && expires && Date.parse(expires) <= Date.parse(starts))
    errors.expiresAt = "The end date must come after the start date.";

  return errors;
}

/** Assumes the values have already passed `validateCouponForm`. */
export function buildCoupon(
  values: CouponFormValues,
  context: { id: string; usedCount?: number; createdAt?: string },
): Coupon {
  const value = toNumber(values.value) ?? 0;
  const maxDiscount = toNumber(values.maxDiscount);
  const usageLimit = toNumber(values.usageLimit);
  const startsAt = startOfDay(values.startsAt.trim());
  const expiresAt = endOfDay(values.expiresAt.trim());

  return {
    id: context.id,
    code: normaliseCouponCode(values.code),
    description: values.description.trim(),
    type: values.type,
    value: values.type === "free-shipping" ? 0 : value,
    minSubtotal: toNumber(values.minSubtotal) ?? 0,
    ...(values.type === "percentage" && maxDiscount !== null
      ? { maxDiscount }
      : {}),
    ...(startsAt ? { startsAt } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(usageLimit !== null ? { usageLimit } : {}),
    usedCount: context.usedCount ?? 0,
    active: values.active,
    createdAt: context.createdAt ?? new Date().toISOString(),
  };
}
