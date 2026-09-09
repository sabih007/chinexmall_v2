import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { formatDate, formatPrice } from "@/lib/format";
import { findOrderByNumber } from "@/lib/order-store";
import {
  deliveryMethod,
  formatPhone,
  isOrderNumber,
  paymentMethod,
} from "@/lib/orders";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  if (!isOrderNumber(number)) notFound();

  const order = await findOrderByNumber(number);
  if (!order) notFound();

  const { customer, totals } = order;
  const whatsapp = whatsappLink({
    phone: customer.phone,
    message: `Hi ${customer.firstName}, about your order ${order.number} —`,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-brand"
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
          All orders
        </Link>

        <h1 className="display mt-3 font-mono text-[1.4rem] tracking-wide">
          {order.number}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Placed {formatDate(order.placedAt)} ·{" "}
          {order.customerId ? "Account holder" : "Guest checkout"} ·{" "}
          {deliveryMethod(order.delivery).label} ({order.eta})
        </p>
      </div>

      <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
        <h2 className="mb-4 text-[14px] font-semibold">Status</h2>
        <OrderStatusForm number={order.number} status={order.status} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
          <h2 className="mb-4 text-[14px] font-semibold">Deliver to</h2>
          <address className="text-[13px] not-italic leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">
              {customer.firstName} {customer.lastName}
            </span>
            <br />
            {customer.address1}
            {customer.address2 && (
              <>
                <br />
                {customer.address2}
              </>
            )}
            <br />
            {customer.city}, {customer.province}
            {customer.postalCode && ` ${customer.postalCode}`}
          </address>

          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[12.5px]">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-muted">Phone</dt>
              <dd className="tabular-nums">{formatPhone(customer.phone)}</dd>
            </div>
            {customer.email && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-muted">Email</dt>
                <dd className="truncate">{customer.email}</dd>
              </div>
            )}
            {customer.notes && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-muted">Notes</dt>
                <dd className="leading-relaxed">{customer.notes}</dd>
              </div>
            )}
          </dl>

          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-[12.5px] font-medium text-mint-ink transition-colors hover:bg-mint-deep"
          >
            <MessageCircle size={14} strokeWidth={1.8} />
            Message on WhatsApp
          </a>
        </section>

        <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
          <h2 className="mb-4 text-[14px] font-semibold">Payment</h2>
          <p className="text-[13px] text-ink-soft">
            {paymentMethod(order.payment).label}
          </p>

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
            <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
            {totals.discount > 0 && (
              <Row
                label={`Discount${order.coupon ? ` · ${order.coupon.code}` : ""}`}
                value={`− ${formatPrice(totals.discount)}`}
              />
            )}
            <Row
              label="Delivery"
              value={totals.delivery === 0 ? "Free" : formatPrice(totals.delivery)}
            />
            {totals.codFee > 0 && (
              <Row label="Cash handling" value={formatPrice(totals.codFee)} />
            )}
            <div className="flex items-baseline justify-between border-t border-line pt-3 text-[14px] font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(totals.total)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="overflow-hidden rounded-tile border border-line bg-paper shadow-card">
        <h2 className="border-b border-line px-5 py-4 text-[14px] font-semibold">
          {order.lines.length} {order.lines.length === 1 ? "item" : "items"}
        </h2>
        <ul>
          {order.lines.map((line, index) => (
            <li
              key={`${line.productId}-${index}`}
              className="flex items-center gap-4 border-b border-line px-5 py-3.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${line.slug}`}
                  className="text-[13px] font-medium hover:text-brand"
                >
                  {line.name}
                </Link>
                <p className="mt-0.5 text-[12px] text-muted">
                  {line.variantLabel && `${line.variantLabel} · `}
                  {formatPrice(line.unitPrice)} × {line.quantity}
                </p>
              </div>
              <p className="shrink-0 text-[13px] font-medium tabular-nums">
                {formatPrice(line.lineTotal)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
