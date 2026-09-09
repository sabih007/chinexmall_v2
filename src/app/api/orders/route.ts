import { NextResponse } from "next/server";
import { resolveVariant } from "@/lib/cart";
import {
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
import { getProductById } from "@/lib/repository";
import type {
  CheckoutRequest,
  CustomerDetails,
  Order,
  OrderLine,
} from "@/lib/types";

/**
 * Order placement seam.
 *
 * Validates the customer, re-prices the basket from the catalogue — the client
 * never gets to name its own price — and returns the placed order. Wire the
 * marked section to your order system; the checkout UI needs no changes.
 */

const MAX_LINES = 50;

interface Failure {
  message: string;
  fields?: CustomerErrors;
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
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) return fail({ message: "Your cart is empty." });
  if (items.length > MAX_LINES) return fail({ message: "That is too many items for one order." });

  const lines: OrderLine[] = [];
  for (const item of items) {
    const product =
      typeof item?.productId === "string"
        ? await getProductById(item.productId)
        : null;
    if (!product) {
      return fail({ message: "One of these products is no longer available." });
    }

    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      return fail({ message: `Choose a quantity for ${product.name}.` });
    }
    if (product.stock < 1) {
      return fail({ message: `${product.name} has just sold out.` });
    }
    if (quantity > product.stock) {
      return fail({
        message: `Only ${product.stock} left of ${product.name}. Please lower the quantity.`,
      });
    }

    const selections =
      item.selections && typeof item.selections === "object"
        ? (item.selections as Record<string, string>)
        : {};
    const { unitPrice, compareAtPrice, imageIndex, variantLabel } =
      resolveVariant(product, selections);

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[imageIndex] ?? product.thumbnail,
      variantLabel,
      selections,
      quantity,
      unitPrice,
      compareAtPrice,
      lineTotal: unitPrice * quantity,
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
    totals: orderTotals(lines, delivery, payment),
    eta: deliveryMethod(delivery).eta,
  };

  // TODO: persist `order`, decrement stock, and notify the store —
  // order confirmation email to `order.customer.email`, WhatsApp or SMS to
  // `order.customer.phone`. Until then the confirmation page renders the order
  // returned here straight from the browser's sessionStorage.

  return NextResponse.json({ order }, { status: 201 });
}
