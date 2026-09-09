"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";
import {
  orderStatuses,
  statusHints,
  statusLabels,
  statusTones,
} from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Where an order sits, and the one control that moves it.
 *
 * Each status is a submit button rather than a select plus a save: the whole
 * interaction is one deliberate click, and the current status is the one that
 * is not clickable.
 */
export function OrderStatusForm({
  number,
  status,
}: {
  number: string;
  status: OrderStatus;
}) {
  const [state, formAction, pending] = useActionState(updateOrderStatusAction, {});
  const current = state.status ?? status;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="number" value={number} />

      <div className="flex flex-wrap gap-1.5">
        {orderStatuses.map((value) => {
          const active = value === current;
          return (
            <button
              key={value}
              type="submit"
              name="status"
              value={value}
              disabled={pending || active}
              aria-current={active ? "true" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-[12.5px] transition-colors disabled:cursor-default",
                active
                  ? cn("border-transparent font-medium", statusTones[value])
                  : "border-line text-ink-soft hover:border-brand hover:text-brand disabled:opacity-50",
              )}
            >
              {statusLabels[value]}
            </button>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-[12px] text-muted">
        {pending && <Loader2 size={13} strokeWidth={2} className="animate-spin" />}
        {state.message ?? statusHints[current]}
      </p>
    </form>
  );
}
