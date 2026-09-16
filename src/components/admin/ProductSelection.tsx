"use client";

import { Loader2, Trash2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { deleteProductsAction } from "@/app/admin/actions";

/* -------------------------------------------------------------------------- */
/*  Bulk selection for the products list                                      */
/*                                                                             */
/*  The rows stay server-rendered; only the tick state lives on the client.    */
/*  `ProductSelection` holds it, `SelectProduct` is the per-row checkbox and   */
/*  `BulkDeleteBar` submits the selection. The bar owns the form (hidden       */
/*  inputs, one per id) so the per-row delete forms never nest inside it.      */
/* -------------------------------------------------------------------------- */

interface Selection {
  ids: string[];
  selected: Set<string>;
  toggle: (id: string) => void;
  setAll: (on: boolean) => void;
}

const SelectionContext = createContext<Selection | null>(null);

function useSelection(): Selection {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("Selection components must sit inside <ProductSelection>");
  }
  return ctx;
}

export function ProductSelection({
  ids,
  children,
}: {
  /** Ids of the rows on screen, in order — the "select all" set. */
  ids: string[];
  children: ReactNode;
}) {
  const [ticked, setTicked] = useState<Set<string>>(() => new Set());

  // Only rows on screen count. A new search result silently drops anything it
  // hid, so a product the operator cannot see can never be removed.
  const selected = useMemo(
    () => new Set(ids.filter((id) => ticked.has(id))),
    [ids, ticked],
  );

  const toggle = useCallback((id: string) => {
    setTicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAll = useCallback(
    (on: boolean) => setTicked(on ? new Set(ids) : new Set()),
    [ids],
  );

  const value = useMemo(
    () => ({ ids, selected, toggle, setAll }),
    [ids, selected, toggle, setAll],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

const checkboxClass =
  "h-4 w-4 shrink-0 cursor-pointer rounded-[4px] border-line accent-brand";

export function SelectProduct({ id, name }: { id: string; name: string }) {
  const { selected, toggle } = useSelection();

  return (
    <input
      type="checkbox"
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      aria-label={`Select ${name}`}
      className={checkboxClass}
    />
  );
}

/**
 * Select-all plus the bulk action. Like the single delete, removing arms
 * first: the button swaps for a confirm/cancel pair rather than a dialog.
 */
export function BulkDeleteBar() {
  const { ids, selected, setAll } = useSelection();
  const count = selected.size;
  const all = ids.length > 0 && count === ids.length;

  // Armed for one specific selection: any change to it disarms by itself, so
  // the confirm button always removes exactly what the operator saw armed.
  const selectionKey = [...selected].join("\n");
  const [armedFor, setArmedFor] = useState<string | null>(null);
  const armed = armedFor === selectionKey;
  const setArmed = (on: boolean) => setArmedFor(on ? selectionKey : null);

  if (ids.length === 0) return null;

  return (
    <div className="flex min-h-[44px] flex-wrap items-center gap-3 rounded-[10px] border border-line bg-paper px-4 py-2 text-[13px]">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={all}
          ref={(el) => {
            if (el) el.indeterminate = count > 0 && !all;
          }}
          onChange={(event) => setAll(event.target.checked)}
          className={checkboxClass}
        />
        <span className="text-muted">
          {count === 0
            ? `Select all (${ids.length})`
            : `${count} of ${ids.length} selected`}
        </span>
      </label>

      {count > 0 && (
        <div className="ml-auto flex items-center gap-1.5">
          {armed ? (
            <form action={deleteProductsAction} className="flex items-center gap-1.5">
              {[...selected].map((id) => (
                <input key={id} type="hidden" name="productId" value={id} />
              ))}
              <ConfirmButton count={count} />
              <button
                type="button"
                onClick={() => setArmed(false)}
                className="rounded-full px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setArmed(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent px-3 py-1.5 text-[11.5px] font-medium text-accent transition-colors hover:bg-accent-soft"
              >
                <Trash2 size={13} strokeWidth={1.8} />
                Remove selected
              </button>
              <button
                type="button"
                onClick={() => setAll(false)}
                className="rounded-full px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-ink"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ConfirmButton({ count }: { count: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11.5px] font-medium text-paper transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {pending && <Loader2 size={12} strokeWidth={2} className="animate-spin" />}
      Remove {count} {count === 1 ? "product" : "products"}
    </button>
  );
}
