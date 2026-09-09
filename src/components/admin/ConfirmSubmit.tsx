"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * A destructive submit that arms before it fires: the first click swaps the
 * icon for a confirm/cancel pair. Inline rather than a `confirm()` dialog, so
 * the page never blocks.
 */
export function ConfirmSubmit({
  action,
  name,
  value,
  label,
  confirmLabel = "Remove",
}: {
  action: (formData: FormData) => void | Promise<void>;
  /** Field the action reads the target from. */
  name: string;
  value: string;
  /** Accessible name for the initial button, e.g. "Remove Kitchen". */
  label: string;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={label}
        title={label}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent"
      >
        <Trash2 size={15} strokeWidth={1.7} />
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name={name} value={value} />
      <PendingButton label={confirmLabel} />
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

function PendingButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11.5px] font-medium text-paper transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {pending && <Loader2 size={12} strokeWidth={2} className="animate-spin" />}
      {label}
    </button>
  );
}
