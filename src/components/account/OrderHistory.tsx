import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { shopperStatusLabels, statusTones } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
        statusTones[status] ?? statusTones.pending,
      )}
    >
      {shopperStatusLabels[status] ?? shopperStatusLabels.pending}
    </span>
  );
}

/**
 * A shopper's own orders, newest first.
 *
 * Only ever rendered for the account the orders belong to — the page above it
 * resolves the session and asks the store for that customer's orders, so there
 * is no order number to guess here.
 */
export function OrderHistory({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-[13px] leading-relaxed text-muted">
        No orders yet. When you place one it will appear here, with its status.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-line">
      {orders.map((order) => {
        const items = order.lines.reduce((n, line) => n + line.quantity, 0);

        return (
          <li key={order.number}>
            <Link
              href={`/order/${order.number}`}
              className="group flex items-center gap-4 py-4 transition-colors first:pt-0 hover:text-brand"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-muted transition-colors group-hover:bg-brand-soft group-hover:text-brand">
                <Package size={16} strokeWidth={1.7} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold tracking-wide">
                    {order.number}
                  </span>
                  <OrderStatusPill status={order.status} />
                </span>
                <span className="mt-0.5 block text-[12px] text-muted">
                  {formatDate(order.placedAt)} · {items}{" "}
                  {items === 1 ? "item" : "items"} ·{" "}
                  <span className="tabular-nums">
                    {formatPrice(order.totals.total)}
                  </span>
                </span>
              </span>

              <ChevronRight
                size={16}
                strokeWidth={1.7}
                aria-hidden
                className="shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
