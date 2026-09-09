import "server-only";

import { requireSupabase } from "@/lib/supabase/client";
import { ensure, fetchAll } from "@/lib/supabase/query";
import { fromOrder, toOrder } from "@/lib/supabase/rows";
import type { Order, OrderStatus, StoredOrder } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Orders — the Postgres backend                                              */
/*                                                                             */
/*  One row per order, with the basket and the delivery address stored as they  */
/*  were at the moment it was placed: a later price change or a shopper editing */
/*  their saved address must never rewrite what was ordered.                    */
/* -------------------------------------------------------------------------- */

const TABLE = "orders";

const withCustomer = (row: Record<string, unknown>): StoredOrder => ({
  ...toOrder(row),
  customerId: typeof row.customer_id === "string" ? row.customer_id : null,
});

export async function saveOrder(
  order: Order,
  customerId: string | null,
): Promise<void> {
  const { error } = await requireSupabase()
    .from(TABLE)
    .upsert(fromOrder(order, customerId));

  ensure(error);
}

export async function findOrderByNumber(
  number: string,
): Promise<StoredOrder | null> {
  const { data, error } = await requireSupabase()
    .from(TABLE)
    .select("*")
    .eq("number", number)
    .maybeSingle();

  ensure(error);
  return data ? withCustomer(data) : null;
}

export async function listOrdersForCustomer(
  customerId: string,
): Promise<StoredOrder[]> {
  const rows = await fetchAll(() =>
    requireSupabase()
      .from(TABLE)
      .select("*")
      .eq("customer_id", customerId)
      .order("placed_at", { ascending: false }),
  );

  return rows.map(withCustomer);
}

export async function listOrders(
  options: { status?: OrderStatus; limit?: number } = {},
): Promise<StoredOrder[]> {
  const db = requireSupabase();

  if (options.limit) {
    let query = db
      .from(TABLE)
      .select("*")
      .order("placed_at", { ascending: false })
      .limit(options.limit);

    if (options.status) query = query.eq("status", options.status);

    const { data, error } = await query;
    ensure(error);
    return (data ?? []).map(withCustomer);
  }

  const rows = await fetchAll(() => {
    const query = db
      .from(TABLE)
      .select("*")
      .order("placed_at", { ascending: false });

    return options.status ? query.eq("status", options.status) : query;
  });

  return rows.map(withCustomer);
}

export async function countOrders(): Promise<number> {
  const { count, error } = await requireSupabase()
    .from(TABLE)
    .select("number", { count: "exact", head: true });

  ensure(error);
  return count ?? 0;
}

/** False when the order number is unknown. */
export async function setOrderStatus(
  number: string,
  status: OrderStatus,
): Promise<boolean> {
  const { data, error } = await requireSupabase()
    .from(TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("number", number)
    .select("number")
    .maybeSingle();

  ensure(error);
  return Boolean(data);
}
