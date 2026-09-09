"use client";

import { CheckCircle2, Database, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { importSeedDataAction } from "@/app/admin/actions";
import { initialImportState } from "@/lib/admin/form-state";

/** Runs the one-time (and repeatable) import into Supabase. */
export function ImportButton() {
  const [state, formAction, pending] = useActionState(
    importSeedDataAction,
    initialImportState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={15} strokeWidth={2} className="animate-spin" />
        ) : (
          <Database size={15} strokeWidth={1.8} />
        )}
        {pending ? "Importing…" : "Import into Supabase"}
      </button>

      {state.status === "done" && state.counts && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card bg-mint px-4 py-3 text-[12.5px] text-mint-ink">
          <CheckCircle2 size={15} strokeWidth={1.8} className="shrink-0" />
          {Object.entries(state.counts)
            .filter(([, count]) => count > 0)
            .map(([table, count]) => `${count} ${table}`)
            .join(" · ") || "Everything was already there."}
        </p>
      )}

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-card border border-accent/25 bg-accent-soft px-4 py-3 text-[12.5px] leading-relaxed text-accent"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
