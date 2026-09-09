import "server-only";

import { createJsonStore } from "@/lib/json-store";
import type { Order, OrderStatus, StoredOrder } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Orders — the file backend                                                  */
/*                                                                             */
/*  `data/orders.json`, keyed by order number. Real orders on a real disk:      */
/*  fine for a single Node host, and the reason the Supabase backend exists     */
/*  for anywhere serverless. `order-store.db.ts` is the same contract.          */
/* -------------------------------------------------------------------------- */

interface OrderBook {
  version: 1;
  orders: Record<string, StoredOrder>;
  updatedAt: string | null;
}

const EMPTY: OrderBook = { version: 1, orders: {}, updatedAt: null };

function isStoredOrder(value: unknown): value is StoredOrder {
  const o = value as Partial<StoredOrder> | null;
  return (
    !!o &&
    typeof o === "object" &&
    typeof o.number === "string" &&
    typeof o.placedAt === "string" &&
    Array.isArray(o.lines) &&
    !!o.totals
  );
}

const store = createJsonStore<OrderBook>("orders.json", EMPTY, (parsed) => {
  const raw = (parsed ?? {}) as Partial<OrderBook>;
  const orders: Record<string, StoredOrder> = {};

  for (const [number, order] of Object.entries(raw.orders ?? {})) {
    if (!isStoredOrder(order)) continue;
    orders[number] = {
      ...order,
      customerId: typeof order.customerId === "string" ? order.customerId : null,
    };
  }

  return { version: 1, orders, updatedAt: raw.updatedAt ?? null };
});

const newestFirst = (a: Order, b: Order) =>
  Date.parse(b.placedAt) - Date.parse(a.placedAt);

export async function saveOrder(
  order: Order,
  customerId: string | null,
): Promise<void> {
  await store.mutate((book) => {
    book.orders[order.number] = { ...order, customerId };
    book.updatedAt = new Date().toISOString();
  });
}

export async function findOrderByNumber(
  number: string,
): Promise<StoredOrder | null> {
  const { orders } = await store.read();
  return orders[number] ?? null;
}

export async function listOrdersForCustomer(
  customerId: string,
): Promise<StoredOrder[]> {
  const { orders } = await store.read();
  return Object.values(orders)
    .filter((order) => order.customerId === customerId)
    .sort(newestFirst);
}

export async function listOrders(
  options: { status?: OrderStatus; limit?: number } = {},
): Promise<StoredOrder[]> {
  const { orders } = await store.read();
  const list = Object.values(orders)
    .filter((order) => !options.status || order.status === options.status)
    .sort(newestFirst);

  return options.limit ? list.slice(0, options.limit) : list;
}

export async function countOrders(): Promise<number> {
  const { orders } = await store.read();
  return Object.keys(orders).length;
}

/** False when the order number is unknown. */
export async function setOrderStatus(
  number: string,
  status: OrderStatus,
): Promise<boolean> {
  return store.mutate((book) => {
    const order = book.orders[number];
    if (!order) return false;

    order.status = status;
    book.updatedAt = new Date().toISOString();
    return true;
  });
}
