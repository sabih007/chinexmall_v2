"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { saveTagAction } from "@/app/admin/actions";

/**
 * A tag's name, editable in place.
 *
 * Only the display name changes — the slug is what products store, so renaming
 * "Gift idea" to "Gifting" leaves every tagged product and every shared
 * `/shop?tag=…` link intact.
 */
export function RenameTagRow({
  id,
  name,
  slug,
}: {
  id: string;
  name: string;
  slug: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium">{name}</p>
          <p className="truncate text-[11.5px] text-muted">#{slug}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Rename ${name}`}
          title={`Rename ${name}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
        >
          <Pencil size={13} strokeWidth={1.7} />
        </button>
      </div>
    );
  }

  return (
    <form action={saveTagAction} className="flex min-w-0 flex-1 items-center gap-2">
      <input type="hidden" name="tagId" value={id} />
      <input
        name="name"
        defaultValue={name}
        required
        maxLength={40}
        autoFocus
        aria-label={`Name for ${name}`}
        className="min-w-0 flex-1 rounded-[10px] border border-line bg-paper px-3 py-1.5 text-[13px] outline-none focus:border-brand"
      />
      <button
        type="submit"
        aria-label="Save name"
        title="Save name"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-paper transition-colors hover:bg-brand-hover"
      >
        <Check size={13} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label="Cancel"
        title="Cancel"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </form>
  );
}
