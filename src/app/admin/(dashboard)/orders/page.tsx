import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { listOrders } from "@/lib/order-store";
import { formatPhone } from "@/lib/orders";
import {
  orderStatuses,
  statusLabels,
  statusTones,
} from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

/** Every order, newest first, with the filter row above it. */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; updated?: string }>;
}) {
  const { status, updated } = await searchParams;
  const filter = orderStatuses.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;

  const [orders, all] = await Promise.all([
    listOrders({ status: filter }),
    listOrders(),
  ]);

  const revenue = all
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totals.total, 0);

  const counts = all.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="display text-[1.5rem]">Orders</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          {all.length === 0
            ? "No orders yet."
            : `${all.length} order${all.length === 1 ? "" : "s"} · ${formatPrice(revenue)} placed`}
        </p>
      </header>

      {updated && (
        <p className="rounded-[10px] border border-mint-deep bg-mint px-4 py-3 text-[13px] text-mint-ink">
          Order <span className="font-mono font-medium">{updated}</span> updated.
        </p>
      )}

      {all.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterPill href="/admin/orders" active={!filter} label="All" count={all.length} />
          {orderStatuses.map((value) => (
            <FilterPill
              key={value}
              href={`/admin/orders?status=${value}`}
              active={filter === value}
              label={statusLabels[value]}
              count={counts[value] ?? 0}
            />
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-tile border border-dashed border-line bg-paper px-5 py-14 text-center">
          <PackageSearch
            size={22}
            strokeWidth={1.5}
            aria-hidden
            className="mx-auto mb-3 text-muted"
          />
          <p className="text-[13.5px] font-medium">
            {filter ? `No ${statusLabels[filter].toLowerCase()} orders` : "No orders yet"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted">
            {filter
              ? "Nothing sits at this status right now."
              : "Orders placed on the storefront land here, with the basket, the address and the delivery choice."}
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-tile border border-line bg-paper shadow-card">
          {orders.map((order) => (
            <li
              key={order.number}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 last:border-0 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/orders/${order.number}`}
                    className="font-mono text-[13.5px] font-semibold tracking-wide hover:text-brand"
                  >
                    {order.number}
                  </Link>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                      statusTones[order.status],
                    )}
                  >
                    {statusLabels[order.status]}
                  </span>
                  {order.customerId === null && (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-[10.5px] text-muted">
                      Guest
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[12px] text-muted">
                  {order.customer.firstName} {order.customer.lastName} ·{" "}
                  {formatPhone(order.customer.phone)} · {order.customer.city} ·{" "}
                  {formatDate(order.placedAt)}
                </p>
              </div>

              <div className="w-28 shrink-0 text-right">
                <p className="text-[13px] font-medium tabular-nums">
                  {formatPrice(order.totals.total)}
                </p>
                <p className="text-[11.5px] text-muted">
                  {order.payment === "cod" ? "Cash on delivery" : "Bank transfer"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-[12px] transition-colors",
        active
          ? "border-brand bg-brand-soft font-medium text-brand"
          : "border-line text-ink-soft hover:border-brand/40",
      )}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
    </Link>
  );
}
