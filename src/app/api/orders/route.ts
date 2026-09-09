import { NextResponse } from "next/server";
import { recordRedemption } from "@/lib/admin/coupons-store";
import { applyCoupon, couponProblem, normaliseCouponCode } from "@/lib/coupons";
import {
  deliveryFee,
  deliveryMethod,
  generateOrderNumber,
  isDeliveryMethodId,
  isPaymentMethodId,
  normaliseCustomer,
  orderTotals,
  validateCustomer,
  emptyCustomer,
  type CustomerErrors,
} from "@/lib/orders";
import { priceBasket, readBasketItems } from "@/lib/pricing";
import { getCouponByCode } from "@/lib/repository";
import type {
  AppliedCoupon,
  CheckoutRequest,
  Coupon,
  CustomerDetails,
  Order,
} from "@/lib/types";

/**
 * Order placement seam.
 *
 * Validates the customer, re-prices the basket from the catalogue — the client
 * never gets to name its own price — re-checks any coupon, and returns the
 * placed order. Wire the marked section to your order system; the checkout UI
 * needs no changes.
 */

interface Failure {
  message: string;
  fields?: CustomerErrors;
  /** Set when the basket was fine but the coupon was not, so the checkout can
   *  drop the code and let the customer carry on. */
  coupon?: "rejected";
}

function fail(body: Failure, status = 400) {
  return NextResponse.json(body, { status });
}

/** Fills in any missing key so validation sees a complete record. */
function readCustomer(value: unknown): CustomerDetails {
  const raw = (value ?? {}) as Partial<Record<keyof CustomerDetails, unknown>>;
  const customer = { ...emptyCustomer };
  for (const key of Object.keys(customer) as (keyof CustomerDetails)[]) {
    if (typeof raw[key] === "string") customer[key] = raw[key];
  }
  return customer;
}

export async function POST(request: Request) {
  let payload: Partial<CheckoutRequest>;
  try {
    payload = (await request.json()) as Partial<CheckoutRequest>;
  } catch {
    return fail({ message: "Invalid request." });
  }

  /* ---- method choices ---- */
  const { delivery, payment } = payload;
  if (!isDeliveryMethodId(delivery) || !isPaymentMethodId(payment)) {
    return fail({ message: "Choose a delivery and payment method." });
  }

  /* ---- customer ---- */
  const customer = normaliseCustomer(readCustomer(payload.customer));
  const fields = validateCustomer(customer);
  if (Object.keys(fields).length > 0) {
    return fail({ message: "Please check the highlighted fields.", fields });
  }

  /* ---- basket ---- */
  const basket = await priceBasket(readBasketItems(payload.items));
  if (!basket.ok) return fail({ message: basket.message });

  const lines = basket.lines;
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);

  /* ---- coupon ----
     Re-checked from the store rather than trusted from the request: the code
     may have expired, been paused or run out while the customer was filling in
     the form. */
  let coupon: Coupon | null = null;
  let applied: AppliedCoupon | undefined;

  const code = normaliseCouponCode(
    typeof payload.couponCode === "string" ? payload.couponCode : "",
  );

  if (code) {
    coupon = await getCouponByCode(code);
    if (!coupon) {
      return fail({
        message: "That coupon code was not recognised.",
        coupon: "rejected",
      });
    }

    const problem = couponProblem(coupon, {
      subtotal,
      deliveryFee: deliveryFee(delivery, subtotal),
    });
    if (problem) {
      return fail({ message: problem, coupon: "rejected" });
    }

    /* Counting the redemption before the order is built closes the race where
       two customers spend the last use of a limited code at the same moment. */
    if (!(await recordRedemption(coupon.id))) {
      return fail({
        message: "That coupon has just reached its limit.",
        coupon: "rejected",
      });
    }

    applied = applyCoupon(coupon, {
      subtotal,
      deliveryFee: deliveryFee(delivery, subtotal),
    });
  }

  const order: Order = {
    number: generateOrderNumber(),
    placedAt: new Date().toISOString(),
    status: "pending",
    customer,
    delivery,
    payment,
    lines,
    totals: orderTotals(lines, delivery, payment, coupon),
    ...(applied ? { coupon: applied } : {}),
    eta: deliveryMethod(delivery).eta,
  };

  // TODO: persist `order`, decrement stock, and notify the store —
  // order confirmation email to `order.customer.email`, WhatsApp or SMS to
  // `order.customer.phone`. Until then the confirmation page renders the order
  // returned here straight from the browser's sessionStorage.

  return NextResponse.json({ order }, { status: 201 });
}
