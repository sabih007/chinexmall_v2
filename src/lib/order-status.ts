import type { OrderStatus } from "./types";

/**
 * The order lifecycle, and how it reads.
 *
 * Two vocabularies for one set of values: the dashboard says what the operator
 * does next, the storefront says what the shopper is waiting for. Pure and
 * isomorphic, so both sides and the database mapper share one list.
 */

export const orderStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}

/** What the dashboard calls each status. */
export const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** What the shopper is told, on their own order. */
export const shopperStatusLabels: Record<OrderStatus, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const statusTones: Record<OrderStatus, string> = {
  pending: "bg-gold-soft text-ink",
  confirmed: "bg-brand-soft text-brand",
  shipped: "bg-tint-blue text-brand-deep",
  delivered: "bg-mint text-mint-ink",
  cancelled: "bg-accent-soft text-accent",
};

/** A line of guidance under the status control in the dashboard. */
export const statusHints: Record<OrderStatus, string> = {
  pending: "Placed by the customer, not yet acknowledged.",
  confirmed: "You have accepted it and it is being packed.",
  shipped: "Handed to the courier.",
  delivered: "Received by the customer.",
  cancelled: "Called off. Nothing is owed either way.",
};
