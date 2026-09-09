import type {
  CategoryFormErrors,
  CategoryFormValues,
} from "./category-form";
import type { CouponFormErrors, CouponFormValues } from "./coupon-form";
import type {
  ProductFormErrors,
  ProductFormValues,
} from "./product-form";

/**
 * Return types for the dashboard's Server Actions.
 *
 * They live here rather than beside the actions because a `"use server"` file
 * may only export async functions — a plain object like the initial state is
 * rejected at build time.
 */

export interface LoginState {
  message?: string;
}

export interface ProductFormState {
  status: "idle" | "error";
  message?: string;
  errors?: ProductFormErrors;
  /** Echoed back so photos uploaded in a rejected submission are not lost. */
  values?: ProductFormValues;
}

export const initialProductFormState: ProductFormState = { status: "idle" };

export interface CouponFormState {
  status: "idle" | "error";
  message?: string;
  errors?: CouponFormErrors;
  values?: CouponFormValues;
}

export const initialCouponFormState: CouponFormState = { status: "idle" };

export interface CategoryFormState {
  status: "idle" | "error";
  message?: string;
  errors?: CategoryFormErrors;
  values?: CategoryFormValues;
}

export const initialCategoryFormState: CategoryFormState = { status: "idle" };
