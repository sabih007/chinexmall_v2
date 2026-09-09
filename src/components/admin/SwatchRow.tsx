"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { saveSwatchAction } from "@/app/admin/actions";

/**
 * A colour in the palette, with its hex editable in place.
 *
 * The name is the key products store, so it is fixed here — a rename would
 * silently detach every product using it. Add a new colour and re-point the
 * products instead.
 */
export function SwatchRow({
  name,
  hex,
  custom,
}: {
  name: string;
  hex: string;
  custom: boolean;
}) {
  const [value, setValue] = useState(hex);
  const dirty = value.toUpperCase() !== hex.toUpperCase();

  return (
    <form action={saveSwatchAction} className="flex min-w-0 flex-1 items-center gap-3">
      <input type="hidden" name="name" value={name} />

      <label className="relative shrink-0 cursor-pointer" title={`Change ${name}`}>
        <span className="sr-only">Colour for {name}</span>
        <input
          name="hex"
          type="color"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-9 w-9 cursor-pointer rounded-full border border-line bg-paper p-0.5"
        />
      </label>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-[13.5px] font-medium">
          {name}
          {custom && (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-medium text-brand">
              Added here
            </span>
          )}
        </p>
        <p className="truncate font-mono text-[11.5px] uppercase text-muted">
          {value}
        </p>
      </div>

      {dirty && (
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[11.5px] font-medium text-paper transition-colors hover:bg-brand-hover"
        >
          <Check size={12} strokeWidth={2.2} />
          Save
        </button>
      )}
    </form>
  );
}
