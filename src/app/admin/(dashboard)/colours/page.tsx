import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import {
  deleteSwatchAction,
  restoreSwatchAction,
  saveSwatchAction,
} from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { SwatchRow } from "@/components/admin/SwatchRow";
import {
  getCatalogue,
  getRemovedSeedSwatches,
  getSwatches,
  isSeedSwatch,
} from "@/lib/repository";

export const metadata = { title: "Colours" };

const errorMessages: Record<string, string> = {
  name: "Give the colour a name.",
  hex: "Enter a hex code like #A7B4A0.",
};

export default async function AdminColoursPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    removed?: string;
    restored?: string;
    error?: string;
  }>;
}) {
  const { saved, removed, restored, error } = await searchParams;

  const [swatches, catalogue, removedSeed] = await Promise.all([
    getSwatches(),
    getCatalogue(),
    getRemovedSeedSwatches(),
  ]);

  const palette = Object.entries(swatches).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  /* A colour is "in use" if products filter by it or offer it as a variant. */
  const usage = (name: string) =>
    catalogue.filter(
      (p) =>
        p.colorFacet === name ||
        p.variants.some(
          (option) =>
            option.type === "color" &&
            option.values.some((v) => v.value === name),
        ),
    ).length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="display text-[1.5rem]">Colours</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          The store&apos;s palette. These are the swatches on product options and
          the colours shoppers filter by.
        </p>
      </header>

      {error && (
        <p className="flex items-center gap-2.5 rounded-[10px] border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] text-accent">
          <AlertCircle size={16} strokeWidth={1.8} className="shrink-0" />
          {errorMessages[error] ?? "That colour could not be saved."}
        </p>
      )}

      {(saved || removed || restored) && (
        <p className="flex items-center gap-2.5 rounded-[10px] border border-mint-deep bg-mint px-4 py-3 text-[13px] text-mint-ink">
          <CheckCircle2 size={16} strokeWidth={1.8} className="shrink-0" />
          {saved && `Saved “${saved}”.`}
          {removed && "Colour removed from the palette."}
          {restored && "Colour restored."}
        </p>
      )}

      <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
        <h2 className="text-[15px] font-semibold">Add a colour</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Names are lowercased and hyphenated — “Ocean Blue” becomes
          <code className="ml-1 rounded bg-sand px-1 py-0.5 text-[11.5px]">
            ocean-blue
          </code>
          .
        </p>
        <form action={saveSwatchAction} className="mt-4 flex flex-wrap gap-2">
          <input
            name="name"
            required
            maxLength={30}
            placeholder="Ocean blue"
            aria-label="Colour name"
            className="min-w-0 flex-1 rounded-[10px] border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
          />
          <input
            name="hex"
            type="color"
            defaultValue="#5B45A3"
            aria-label="Colour"
            className="h-11 w-14 shrink-0 cursor-pointer rounded-[10px] border border-line bg-paper p-1"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover"
          >
            <Plus size={15} strokeWidth={2} />
            Add colour
          </button>
        </form>
      </section>

      <ul className="overflow-hidden rounded-tile border border-line bg-paper shadow-card">
        {palette.map(([name, hex]) => {
          const used = usage(name);

          return (
            <li
              key={name}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 sm:px-5"
            >
              <SwatchRow name={name} hex={hex} custom={!isSeedSwatch(name)} />

              <div className="w-24 shrink-0 text-right">
                {used > 0 ? (
                  <Link
                    href={`/shop?color=${name}`}
                    target="_blank"
                    className="text-[12.5px] tabular-nums text-muted hover:text-brand"
                  >
                    {used} product{used === 1 ? "" : "s"}
                  </Link>
                ) : (
                  <span className="text-[12.5px] text-muted">Unused</span>
                )}
              </div>

              <ConfirmSubmit
                action={deleteSwatchAction}
                name="name"
                value={name}
                label={`Remove ${name}`}
              />
            </li>
          );
        })}
      </ul>

      {removedSeed.length > 0 && (
        <section className="rounded-tile border border-line bg-paper p-5 shadow-card">
          <h2 className="text-[14px] font-semibold">Removed colours</h2>
          <ul className="mt-4 divide-y divide-line">
            {removedSeed.map((swatch) => (
              <li
                key={swatch.name}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <span className="flex items-center gap-2.5 text-[13px] text-ink-soft">
                  <span
                    aria-hidden
                    className="h-5 w-5 rounded-full border border-line"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  {swatch.name}
                </span>
                <form action={restoreSwatchAction}>
                  <input type="hidden" name="name" value={swatch.name} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-3 py-1.5 text-[11.5px] transition-colors hover:border-brand hover:text-brand"
                  >
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[12px] leading-relaxed text-muted">
        Changing a colour&apos;s hex updates every product that uses it by name.
        Removing one leaves products that reference it working — they simply
        lose the swatch dot.
      </p>
    </div>
  );
}
