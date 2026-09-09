"use client";

import { Check, MessageCircle, Package, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { orderKey } from "@/app/(storefront)/checkout/CheckoutClient";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Primitives";
import { formatDate, formatPrice } from "@/lib/format";
import {
  bankAccount,
  deliveryMethod,
  formatPhone,
  paymentMethod,
} from "@/lib/orders";
import { site } from "@/lib/site";
import type { Order } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";

/** A store that never changes — this is a hydration flag, not live state. */
const subscribeNever = () => () => {};

function readOrder(number: string): Order | null {
  try {
    const raw = window.sessionStorage.getItem(orderKey(number));
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    /* unavailable storage — fall through to the short confirmation */
    return null;
  }
}

/**
 * Order confirmation.
 *
 * A signed-in shopper's own order arrives from the server, already looked up
 * by number. For a guest — or anyone else — it is read from sessionStorage,
 * where their checkout left it, which is what keeps an order number from being
 * a way to read a stranger's address.
 */
export function OrderConfirmation({
  number,
  order: fromServer = null,
}: {
  number: string;
  order?: Order | null;
}) {
  /* sessionStorage cannot be read while rendering on the server, so wait for
     hydration before deciding what to show. */
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const order = useMemo(
    () => fromServer ?? (hydrated ? readOrder(number) : null),
    [fromServer, hydrated, number],
  );

  if (!order && !hydrated) {
    return (
      <div className="space-y-4 pb-24">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!order) return <OrderNotOnThisDevice number={number} />;

  const method = deliveryMethod(order.delivery);
  const support = whatsappLink({
    message: `Hi, I have a question about order ${order.number}.`,
  });

  return (
    <div className="grid gap-10 pb-24 lg:grid-cols-[1fr_400px] lg:gap-16">
      <aside className="lg:order-2 lg:sticky lg:top-28 lg:self-start">
        <OrderSummary
          lines={order.lines.map((line, i) => ({
            key: `${line.productId}-${i}`,
            slug: line.slug,
            name: line.name,
            image: line.image,
            variantLabel: line.variantLabel,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          }))}
          totals={order.totals}
          delivery={order.delivery}
          coupon={order.coupon}
          linkProducts={false}
        />
      </aside>

      <div className="space-y-10 lg:order-1">
        <div className="rounded-card border border-line p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mint-ink">
            <Check size={20} strokeWidth={2} className="text-paper" />
          </div>
          <h2 className="display mt-5 text-[1.6rem] sm:text-[1.9rem]">
            Thank you, {order.customer.firstName}.
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
            Your order is in. We will call or message{" "}
            {formatPhone(order.customer.phone)} to confirm it before dispatch.
          </p>

          <dl className="mt-7 grid gap-x-8 gap-y-4 border-t border-line pt-6 sm:grid-cols-2">
            <Detail label="Order number">
              <span className="font-semibold tracking-[0.04em]">
                {order.number}
              </span>
            </Detail>
            <Detail label="Placed">{formatDate(order.placedAt)}</Detail>
            <Detail label="Delivery">
              {method.label} · {order.eta}
            </Detail>
            <Detail label="Payment">{paymentMethod(order.payment).label}</Detail>
          </dl>
        </div>

        {order.payment === "cod" ? (
          <Instruction
            icon={<Truck size={16} strokeWidth={1.6} />}
            title="Have the cash ready"
          >
            Please keep{" "}
            <strong className="font-semibold text-ink">
              {formatPrice(order.totals.total)}
            </strong>{" "}
            ready for the rider. Payment is collected at your door — nothing is
            taken before your parcel arrives.
          </Instruction>
        ) : (
          <Instruction
            icon={<Package size={16} strokeWidth={1.6} />}
            title="Transfer and send the receipt"
          >
            Transfer{" "}
            <strong className="font-semibold text-ink">
              {formatPrice(order.totals.total)}
            </strong>{" "}
            to the account below and send us the receipt on WhatsApp, quoting{" "}
            {order.number}. We dispatch the same day it clears.
            <span className="mt-4 block rounded-card border border-line bg-sand px-4 py-3 text-[12.5px] text-ink">
              <span className="block font-medium">{bankAccount.bank}</span>
              <span className="mt-1 block">{bankAccount.title}</span>
              <span className="mt-1 block tabular-nums">
                {bankAccount.number}
              </span>
              <span className="mt-1 block tabular-nums text-muted">
                {bankAccount.iban}
              </span>
            </span>
          </Instruction>
        )}

        <section>
          <h3 className="eyebrow mb-4 text-muted">Delivering to</h3>
          <address className="text-[14px] not-italic leading-relaxed">
            {order.customer.firstName} {order.customer.lastName}
            <br />
            {order.customer.address1}
            {order.customer.address2 && (
              <>
                <br />
                {order.customer.address2}
              </>
            )}
            <br />
            {order.customer.city}
            {order.customer.postalCode ? ` ${order.customer.postalCode}` : ""},{" "}
            {order.customer.province}
            <br />
            <span className="text-muted">
              {formatPhone(order.customer.phone)}
            </span>
            {order.customer.email && (
              <>
                <br />
                <span className="text-muted">{order.customer.email}</span>
              </>
            )}
          </address>
          {order.customer.notes && (
            <p className="mt-4 border-l-2 border-line pl-4 text-[13px] text-muted">
              {order.customer.notes}
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-8">
          <ButtonLink href="/shop" size="lg">
            Continue shopping
          </ButtonLink>
          <a
            href={support}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-13 items-center gap-2 rounded-full border border-line px-6 text-[14px] font-medium transition-colors hover:border-brand hover:text-brand"
          >
            <MessageCircle size={15} strokeWidth={1.6} />
            Ask about this order
          </a>
        </div>

        <p className="text-[12px] text-muted">
          Keep your order number handy — {site.whatsapp.display} · {site.email}
        </p>
      </div>
    </div>
  );
}

/**
 * Reached by refreshing on another device, or after the tab was closed: the
 * order exists, we simply have nowhere to read it from yet.
 */
function OrderNotOnThisDevice({ number }: { number: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-card border border-line px-6 py-16 text-center sm:px-10">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Package size={19} strokeWidth={1.4} className="text-muted" />
      </div>
      <h2 className="display mt-5 text-[1.6rem]">Order {number}</h2>
      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
        We cannot show the details of this order on this device. Message us the
        order number and we will send you its status right away.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={whatsappLink({
            message: `Hi, could you tell me the status of order ${number}?`,
          })}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover"
        >
          <MessageCircle size={15} strokeWidth={1.6} />
          Ask on WhatsApp
        </a>
        <Link
          href="/shop"
          className="inline-flex h-12 items-center rounded-full border border-line px-6 text-[13px] font-medium transition-colors hover:border-brand hover:text-brand"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[13.5px]">{children}</dd>
    </div>
  );
}

function Instruction({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-line p-6">
      <h3 className="flex items-center gap-2.5 text-[14px] font-semibold">
        <span className="text-brand">{icon}</span>
        {title}
      </h3>
      <div className="mt-3 text-[13.5px] leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}
