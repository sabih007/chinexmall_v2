import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Order, OrderStatus, StoredOrder } from "@/lib/types";
import * as db from "./order-store.db";
import * as file from "./order-store.file";

/* -------------------------------------------------------------------------- */
/*  Order store                                                                */
/*                                                                             */
/*  Where placed orders live: Postgres when Supabase is configured, and         */
/*  `data/orders.json` when it is not.                                          */
/*                                                                             */
/*  An order is a record of something that happened, so nothing here edits one  */
/*  beyond its status — the basket, the prices and the address are written once */
/*  and read back unchanged.                                                    */
/* -------------------------------------------------------------------------- */

const backend = () => (isSupabaseConfigured() ? db : file);

/** `customerId` is null for a guest checkout. */
export function saveOrder(
  order: Order,
  customerId: string | null,
): Promise<void> {
  return backend().saveOrder(order, customerId);
}

export function findOrderByNumber(number: string): Promise<StoredOrder | null> {
  return backend().findOrderByNumber(number);
}

export function listOrdersForCustomer(
  customerId: string,
): Promise<StoredOrder[]> {
  return backend().listOrdersForCustomer(customerId);
}

export function listOrders(
  options: { status?: OrderStatus; limit?: number } = {},
): Promise<StoredOrder[]> {
  return backend().listOrders(options);
}

export function countOrders(): Promise<number> {
  return backend().countOrders();
}

/** False when the order number is unknown. */
export function setOrderStatus(
  number: string,
  status: OrderStatus,
): Promise<boolean> {
  return backend().setOrderStatus(number, status);
}

/**
 * A stored order as a page may send it to the browser: the same order without
 * the account id it is filed against. Built field by field, so a column added
 * to storage later is never handed out by accident.
 */
export function toOrder(stored: StoredOrder): Order {
  return {
    number: stored.number,
    placedAt: stored.placedAt,
    status: stored.status,
    customer: stored.customer,
    delivery: stored.delivery,
    payment: stored.payment,
    lines: stored.lines,
    totals: stored.totals,
    ...(stored.coupon ? { coupon: stored.coupon } : {}),
    eta: stored.eta,
  };
}
