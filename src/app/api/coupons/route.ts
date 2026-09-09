import { NextResponse } from "next/server";
import { couponProblem, normaliseCouponCode } from "@/lib/coupons";
import {
  deliveryFee,
  isDeliveryMethodId,
  isPaymentMethodId,
  orderTotals,
} from "@/lib/orders";
import { priceBasket, readBasketItems } from "@/lib/pricing";
import { getCouponByCode } from "@/lib/repository";

/**
 * Checks a coupon code against a live basket.
 *
 * The basket is re-priced from the catalogue first, so the discount quoted here
 * is the discount `/api/orders` will apply — which it re-checks anyway, because
 * a coupon can expire or run out between the two requests.
 *
 * Returns the coupon itself so the checkout can keep the total accurate while
 * the customer switches delivery or payment method, without another round trip.
 */
export async function POST(request: Request) {
  let payload: {
    code?: unknown;
    items?: unknown;
    delivery?: unknown;
    payment?: unknown;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const code = normaliseCouponCode(
    typeof payload.code === "string" ? payload.code : "",
  );
  if (!code) {
    return NextResponse.json(
      { message: "Enter a coupon code." },
      { status: 400 },
    );
  }

  const delivery = isDeliveryMethodId(payload.delivery)
    ? payload.delivery
    : "standard";
  const payment = isPaymentMethodId(payload.payment) ? payload.payment : "cod";

  const basket = await priceBasket(readBasketItems(payload.items));
  if (!basket.ok) {
    return NextResponse.json({ message: basket.message }, { status: 400 });
  }

  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return NextResponse.json(
      { message: "That coupon code was not recognised." },
      { status: 404 },
    );
  }

  const subtotal = basket.lines.reduce((n, l) => n + l.lineTotal, 0);
  const problem = couponProblem(coupon, {
    subtotal,
    deliveryFee: deliveryFee(delivery, subtotal),
  });

  if (problem) {
    return NextResponse.json({ message: problem }, { status: 400 });
  }

  return NextResponse.json({
    coupon,
    totals: orderTotals(basket.lines, delivery, payment, coupon),
  });
}
