/**
 * Checkout rules: validation, delivery and payment pricing, order numbers.
 *
 * Pure and isomorphic on purpose. The checkout form uses it to show errors as
 * the customer types, and `/api/orders` uses the very same functions to decide
 * whether to accept the order and what it costs — so the two can never drift.
 */

import {
  bankAccount,
  deliveryMethods,
  paymentMethods,
  provinces,
  site,
  type DeliveryMethod,
  type PaymentMethod,
} from "./site";
import type {
  CustomerDetails,
  DeliveryMethodId,
  OrderLine,
  OrderTotals,
  PaymentMethodId,
} from "./types";

export { bankAccount, deliveryMethods, paymentMethods, provinces };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const emptyCustomer: CustomerDetails = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  postalCode: "",
  notes: "",
};

/* -------------------------------------------------------------------------- */
/*  Methods                                                                   */
/* -------------------------------------------------------------------------- */

export function deliveryMethod(id: DeliveryMethodId): DeliveryMethod {
  return deliveryMethods.find((m) => m.id === id) ?? deliveryMethods[0];
}

export function paymentMethod(id: PaymentMethodId): PaymentMethod {
  return paymentMethods.find((m) => m.id === id) ?? paymentMethods[0];
}

export function isDeliveryMethodId(value: unknown): value is DeliveryMethodId {
  return deliveryMethods.some((m) => m.id === value);
}

export function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return paymentMethods.some((m) => m.id === value);
}

/* -------------------------------------------------------------------------- */
/*  Phone numbers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Accepts the shapes Pakistani customers actually type — `0300 1234567`,
 * `+92 300 1234567`, `0092300…` — and returns E.164, or `null` if it is not a
 * mobile number we can deliver to.
 */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  const national = digits.startsWith("0092")
    ? digits.slice(4)
    : digits.startsWith("92")
      ? digits.slice(2)
      : digits.startsWith("0")
        ? digits.slice(1)
        : digits;

  // Pakistani mobiles are 10 national digits beginning with 3.
  return /^3\d{9}$/.test(national) ? `+92${national}` : null;
}

/** `+923001234567` → `+92 300 1234567` */
export function formatPhone(e164: string): string {
  const m = /^\+92(\d{3})(\d{7})$/.exec(e164);
  return m ? `+92 ${m[1]} ${m[2]}` : e164;
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

export type CustomerField = keyof CustomerDetails;
export type CustomerErrors = Partial<Record<CustomerField, string>>;

/** Fields the customer must fill in — used to drive `required` and focus order. */
export const requiredFields: CustomerField[] = [
  "firstName",
  "lastName",
  "phone",
  "address1",
  "city",
  "province",
];

export function validateCustomer(customer: CustomerDetails): CustomerErrors {
  const errors: CustomerErrors = {};
  const trimmed = (field: CustomerField) => customer[field].trim();

  if (trimmed("firstName").length < 2)
    errors.firstName = "Please enter your first name.";
  if (trimmed("lastName").length < 2)
    errors.lastName = "Please enter your last name.";

  if (!trimmed("phone")) errors.phone = "We need a number for delivery updates.";
  else if (!normalisePhone(trimmed("phone")))
    errors.phone = "Enter a valid mobile number, e.g. 0300 1234567.";

  if (trimmed("email") && !EMAIL.test(trimmed("email")))
    errors.email = "That email address does not look right.";

  if (trimmed("address1").length < 6)
    errors.address1 = "Please enter your street address.";
  if (trimmed("city").length < 2) errors.city = "Please enter your city.";
  if (!provinces.includes(trimmed("province") as (typeof provinces)[number]))
    errors.province = "Please choose your province.";

  if (trimmed("postalCode") && !/^\d{5}$/.test(trimmed("postalCode")))
    errors.postalCode = "A postal code is 5 digits.";

  if (trimmed("notes").length > 500)
    errors.notes = "Please keep delivery notes under 500 characters.";

  return errors;
}

/** Trims every field and rewrites the phone number to E.164. */
export function normaliseCustomer(customer: CustomerDetails): CustomerDetails {
  const out = { ...customer };
  for (const key of Object.keys(out) as CustomerField[]) {
    out[key] = out[key].trim();
  }
  out.phone = normalisePhone(out.phone) ?? out.phone;
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Money                                                                     */
/* -------------------------------------------------------------------------- */

export function deliveryFee(id: DeliveryMethodId, subtotal: number): number {
  const method = deliveryMethod(id);
  if (method.freeOverThreshold && subtotal >= site.freeShippingThreshold)
    return 0;
  return method.fee;
}

export function orderTotals(
  lines: Pick<OrderLine, "unitPrice" | "compareAtPrice" | "quantity">[],
  delivery: DeliveryMethodId,
  payment: PaymentMethodId,
): OrderTotals {
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
  const savings = lines.reduce(
    (n, l) =>
      n + Math.max((l.compareAtPrice ?? l.unitPrice) - l.unitPrice, 0) * l.quantity,
    0,
  );
  const shipping = deliveryFee(delivery, subtotal);
  const codFee = paymentMethod(payment).fee;

  return {
    subtotal,
    savings,
    delivery: shipping,
    codFee,
    total: subtotal + shipping + codFee,
  };
}

/* -------------------------------------------------------------------------- */
/*  Order numbers                                                             */
/* -------------------------------------------------------------------------- */

const ORDER_PREFIX = site.orderPrefix;

/**
 * A short reference a customer can read out on the phone: time-ordered, so two
 * orders placed in the same millisecond are still distinguishable by the random
 * tail. Replace with the sequence your order system issues once one exists.
 */
export function generateOrderNumber(now = Date.now()): string {
  const stamp = now.toString(36).toUpperCase().slice(-6);
  const noise = Math.floor(Math.random() * 36 ** 2)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `${ORDER_PREFIX}-${stamp}${noise}`;
}

/** Guards the confirmation route against arbitrary strings in the URL. */
export function isOrderNumber(value: string): boolean {
  return new RegExp(`^${ORDER_PREFIX}-[0-9A-Z]{6,10}$`).test(value);
}
