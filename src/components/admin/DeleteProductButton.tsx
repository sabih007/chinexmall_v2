"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteProductAction } from "@/app/admin/actions";

/**
 * Two-step delete: the first click swaps the button for a confirm/cancel pair.
 * Inline rather than a `confirm()` dialog so the page never blocks.
 */
export function DeleteProductButton({
  productId,
  name,
}: {
  productId: string;
  name: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={`Remove ${name}`}
        title={`Remove ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent"
      >
        <Trash2 size={15} strokeWidth={1.7} />
      </button>
    );
  }

  return (
    <form action={deleteProductAction} className="flex items-center gap-1.5">
      <input type="hidden" name="productId" value={productId} />
      <ConfirmButton />
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded-full px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-ink"
      >
        Cancel
      </button>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11.5px] font-medium text-paper transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {pending && <Loader2 size={12} strokeWidth={2} className="animate-spin" />}
      Remove
    </button>
  );
}
