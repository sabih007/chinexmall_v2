import { NextResponse, after } from "next/server";
import { currentCustomer } from "@/lib/account/session";
import { recordRedemption } from "@/lib/admin/coupons-store";
import { saveOrder } from "@/lib/order-store";
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
import {
  requestContext,
  sendPurchaseEvent,
} from "@/lib/meta-pixel/capi.server";
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
 * Order placement.
 *
 * Validates the customer, re-prices the basket from the catalogue — the client
 * never gets to name its own price — re-checks any coupon, stores the order and
 * returns it. A signed-in shopper's order is filed against their account; a
 * guest's is filed on its own.
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

  /* Filed against the account when one is signed in, so it shows up in the
     shopper's order history — and stored either way. */
  const account = await currentCustomer();

  try {
    await saveOrder(order, account?.id ?? null);
  } catch (cause) {
    /* Better to ask for a retry than to hand over a confirmation number for an
       order nobody recorded. */
    console.error("Could not store order", order.number, cause);
    return fail(
      { message: "We could not record that order. Please try again." },
      500,
    );
  }

  /* The Meta Pixel's server-side Purchase — sent only now, past every way
     this request can still fail, so it reports nothing but a stored order.
     `after` keeps it off the shopper's critical path: the confirmation renders
     while this runs, and nothing it does can fail the order. Its event ID is
     derived from the order number, which is also what the browser's Purchase
     uses, so Meta counts the pair once. */
  const meta = requestContext(request);
  const accountId = account?.id ?? null;
  after(async () => {
    await sendPurchaseEvent(order, { ...meta, accountId });
  });

  // TODO: decrement stock, and notify the store — order confirmation email to
  // `order.customer.email`, WhatsApp or SMS to `order.customer.phone`.

  return NextResponse.json({ order }, { status: 201 });
}
