"use client";

import { Lock, MessageCircle, RotateCcw, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Field,
  OptionCard,
  Select,
  Step,
  TextArea,
  TextInput,
} from "@/components/checkout/Fields";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { useStore } from "@/components/providers/StoreProvider";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Primitives";
import { formatPrice, freeShippingProgress } from "@/lib/format";
import {
  bankAccount,
  deliveryFee,
  deliveryMethods,
  emptyCustomer,
  orderTotals,
  paymentMethods,
  provinces,
  validateCustomer,
  type CustomerErrors,
  type CustomerField,
} from "@/lib/orders";
import { site } from "@/lib/site";
import type {
  CartLine,
  CustomerDetails,
  DeliveryMethodId,
  Order,
  PaymentMethodId,
} from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";

/** Remembers the address between visits — same device only, like the cart. */
const DETAILS_KEY = "gh.checkout.v1";

/** Where a placed order waits for the confirmation page to pick it up. */
export const orderKey = (number: string) => `gh.order.${number}`;

/** The address this device saved last time, if any. */
function savedCustomer(): CustomerDetails {
  try {
    const raw = window.localStorage.getItem(DETAILS_KEY);
    if (raw) return { ...emptyCustomer, ...JSON.parse(raw) };
  } catch {
    /* corrupt or unavailable storage — start with an empty form */
  }
  return emptyCustomer;
}

export function CheckoutClient() {
  const router = useRouter();
  const { lines, hydrated, clearCart } = useStore();

  /* Suppresses the empty-cart redirect between clearing the cart and landing
     on the confirmation page. */
  const placed = useRef(false);

  useEffect(() => {
    if (hydrated && lines.length === 0 && !placed.current) {
      router.replace("/cart");
    }
  }, [hydrated, lines.length, router]);

  if (!hydrated || lines.length === 0) return <CheckoutSkeleton />;

  /* Mounted only once the cart is known, so the form can seed itself from the
     saved address in a single pass rather than filling in after paint. */
  return (
    <CheckoutForm
      lines={lines}
      onPlaced={() => {
        placed.current = true;
        clearCart();
      }}
    />
  );
}

function CheckoutForm({
  lines,
  onPlaced,
}: {
  lines: CartLine[];
  onPlaced: () => void;
}) {
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDetails>(savedCustomer);
  const [delivery, setDelivery] = useState<DeliveryMethodId>("standard");
  const [payment, setPayment] = useState<PaymentMethodId>("cod");
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* Re-validate on every keystroke only after a first failed submit. */
  const validateLive = useRef(false);

  const totals = orderTotals(lines, delivery, payment);
  const shipping = freeShippingProgress(totals.subtotal);

  function update(field: CustomerField, value: string) {
    const next = { ...customer, [field]: value };
    setCustomer(next);
    setFormError(null);
    if (validateLive.current) setErrors(validateCustomer(next));
    try {
      window.localStorage.setItem(DETAILS_KEY, JSON.stringify(next));
    } catch {
      /* private mode — the form still works for this visit */
    }
  }

  function focusFirstError(found: CustomerErrors) {
    const first = Object.keys(found)[0];
    if (!first) return;
    const el = document.getElementById(first);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  }

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    validateLive.current = true;
    const found = validateCustomer(customer);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Please check the highlighted fields.");
      focusFirstError(found);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          delivery,
          payment,
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            selections: l.selections,
          })),
        }),
      });

      const data = (await response.json()) as {
        order?: Order;
        message?: string;
        fields?: CustomerErrors;
      };

      if (!response.ok || !data.order) {
        if (data.fields) {
          setErrors(data.fields);
          focusFirstError(data.fields);
        }
        setFormError(
          data.message ?? "We could not place that order. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      try {
        window.sessionStorage.setItem(
          orderKey(data.order.number),
          JSON.stringify(data.order),
        );
      } catch {
        /* the confirmation page falls back to a short thank-you */
      }
      onPlaced();
      router.replace(`/order/${data.order.number}`);
    } catch {
      setFormError(
        "We could not reach the store. Check your connection and try again.",
      );
      setSubmitting(false);
    }
  }

  const whatsappOrder = whatsappLink({
    message: [
      "Hi, I would like to place this order:",
      ...lines.map(
        (l) =>
          `• ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} × ${l.quantity} — ${formatPrice(l.unitPrice * l.quantity)}`,
      ),
      `Total: ${formatPrice(totals.total)}`,
    ].join("\n"),
  });

  return (
    <form
      onSubmit={placeOrder}
      noValidate
      className="grid gap-10 pb-24 lg:grid-cols-[1fr_400px] lg:gap-16"
    >
      {/* Summary sits first on mobile, where it collapses to a single line. */}
      <aside className="lg:order-2 lg:sticky lg:top-28 lg:self-start">
        <OrderSummary
          lines={summaryLines(lines)}
          totals={totals}
          delivery={delivery}
        />

        {delivery === "standard" && !shipping.qualified && (
          <p className="mt-4 bg-sand px-4 py-3 text-[12px] text-ink/80">
            Add{" "}
            <strong className="font-semibold">
              {formatPrice(shipping.remaining)}
            </strong>{" "}
            more to your cart and delivery is free.
          </p>
        )}

        <ul className="mt-6 space-y-3 text-[12px] text-muted">
          <Assurance icon={<Lock size={14} strokeWidth={1.6} />}>
            Your details are used for this delivery only.
          </Assurance>
          <Assurance icon={<Truck size={14} strokeWidth={1.6} />}>
            Dispatched within 24–48 hours and tracked to your door.
          </Assurance>
          <Assurance icon={<RotateCcw size={14} strokeWidth={1.6} />}>
            7-day returns on unused items.{" "}
            <Link
              href="/policies/refund"
              className="underline underline-offset-2"
            >
              Read the policy
            </Link>
            .
          </Assurance>
        </ul>
      </aside>

      <div className="space-y-8 lg:order-1">
        <Step index={1} title="Contact">
          <div className="grid gap-x-5 sm:grid-cols-2">
            <Field label="Mobile number" htmlFor="phone" error={errors.phone}>
              <TextInput
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0300 1234567"
                value={customer.phone}
                error={errors.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email} optional>
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={customer.email}
                error={errors.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
          </div>
          <p className="-mt-1 text-[12px] text-muted">
            We call or message this number to confirm your order before
            dispatch.
          </p>
        </Step>

        <Step index={2} title="Delivery address">
          <div className="grid gap-x-5 sm:grid-cols-2">
            <Field
              label="First name"
              htmlFor="firstName"
              error={errors.firstName}
            >
              <TextInput
                id="firstName"
                autoComplete="given-name"
                value={customer.firstName}
                error={errors.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
              <TextInput
                id="lastName"
                autoComplete="family-name"
                value={customer.lastName}
                error={errors.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </Field>

            <Field
              label="Address"
              htmlFor="address1"
              error={errors.address1}
              className="sm:col-span-2"
            >
              <TextInput
                id="address1"
                autoComplete="address-line1"
                placeholder="House or flat number and street"
                value={customer.address1}
                error={errors.address1}
                onChange={(e) => update("address1", e.target.value)}
              />
            </Field>

            <Field
              label="Area or landmark"
              htmlFor="address2"
              error={errors.address2}
              optional
              className="sm:col-span-2"
            >
              <TextInput
                id="address2"
                autoComplete="address-line2"
                placeholder="Block, sector, or a landmark the rider will know"
                value={customer.address2}
                error={errors.address2}
                onChange={(e) => update("address2", e.target.value)}
              />
            </Field>

            <Field label="City" htmlFor="city" error={errors.city}>
              <TextInput
                id="city"
                autoComplete="address-level2"
                value={customer.city}
                error={errors.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </Field>

            <Field label="Province" htmlFor="province" error={errors.province}>
              <Select
                id="province"
                autoComplete="address-level1"
                value={customer.province}
                error={errors.province}
                onChange={(e) => update("province", e.target.value)}
              >
                <option value="">Choose a province</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Postal code"
              htmlFor="postalCode"
              error={errors.postalCode}
              optional
            >
              <TextInput
                id="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="54000"
                value={customer.postalCode}
                error={errors.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
              />
            </Field>

            <Field
              label="Delivery notes"
              htmlFor="notes"
              error={errors.notes}
              optional
              className="sm:col-span-2"
            >
              <TextArea
                id="notes"
                placeholder="Anything the rider should know — a gate code, or a better time to call."
                value={customer.notes}
                error={errors.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </Field>
          </div>
        </Step>

        <Step index={3} title="Delivery method">
          <div className="space-y-3">
            {deliveryMethods.map((method) => {
              const fee = deliveryFee(method.id, totals.subtotal);
              return (
                <OptionCard
                  key={method.id}
                  name="delivery"
                  value={method.id}
                  checked={delivery === method.id}
                  onChange={(value) => setDelivery(value as DeliveryMethodId)}
                  title={method.label}
                  description={`${method.description} ${method.eta}.`}
                  trailing={fee === 0 ? "Free" : formatPrice(fee)}
                />
              );
            })}
          </div>
        </Step>

        <Step index={4} title="Payment">
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <OptionCard
                key={method.id}
                name="payment"
                value={method.id}
                checked={payment === method.id}
                onChange={(value) => setPayment(value as PaymentMethodId)}
                title={method.label}
                description={method.description}
                trailing={
                  method.fee > 0 ? `+ ${formatPrice(method.fee)}` : undefined
                }
              >
                {method.id === "bank-transfer" && (
                  <span className="mt-4 block border-t border-line pt-4 text-[12.5px] text-muted">
                    <span className="block font-medium text-ink">
                      {bankAccount.bank} — {bankAccount.title}
                    </span>
                    <span className="mt-1 block tabular-nums">
                      {bankAccount.number}
                    </span>
                    <span className="mt-2 block">
                      The full details appear again on your confirmation page.
                    </span>
                  </span>
                )}
              </OptionCard>
            ))}
          </div>
        </Step>

        <div className="border-t border-line pt-8">
          {formError && (
            <p
              role="alert"
              className="mb-5 rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-[13px] text-accent"
            >
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" full disabled={submitting}>
            {submitting
              ? "Placing your order…"
              : `Place order · ${formatPrice(totals.total)}`}
          </Button>

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted">
            By placing this order you agree to our{" "}
            <Link
              href="/policies/terms"
              className="underline underline-offset-2"
            >
              terms
            </Link>{" "}
            and{" "}
            <Link
              href="/policies/refund"
              className="underline underline-offset-2"
            >
              refund policy
            </Link>
            .
          </p>

          <div className="mt-6 flex flex-col items-center gap-2 border-t border-line pt-6 text-center">
            <p className="text-[12px] text-muted">
              Prefer to order in a chat? We are on WhatsApp at{" "}
              {site.whatsapp.display}.
            </p>
            <a
              href={whatsappOrder}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-[12.5px] font-medium text-mint-ink transition-colors hover:bg-mint-deep"
            >
              <MessageCircle size={14} strokeWidth={1.6} />
              Order via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}

function summaryLines(lines: CartLine[]) {
  return lines.map((line) => ({
    key: line.key,
    slug: line.slug,
    name: line.name,
    image: line.image,
    variantLabel: line.variantLabel,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  }));
}

function Assurance({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-px shrink-0 text-ink/60">{icon}</span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-10 pb-24 lg:grid-cols-[1fr_400px] lg:gap-16">
      <div className="space-y-4 lg:order-1">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full lg:order-2" />
    </div>
  );
}
