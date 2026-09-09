import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { deleteTagAction, saveTagAction } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { RenameTagRow } from "@/components/admin/RenameTagRow";
import { getCatalogue, getTags } from "@/lib/repository";

export const metadata = { title: "Tags" };

const errorMessages: Record<string, string> = {
  empty: "Give the tag a name.",
  slug: "That name has no letters or numbers in it.",
  taken: "You already have a tag with that name.",
};

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; removed?: string; error?: string }>;
}) {
  const { saved, removed, error } = await searchParams;

  const [tags, catalogue] = await Promise.all([getTags(), getCatalogue()]);

  const usage = (slug: string) =>
    catalogue.filter((p) => p.tags.includes(slug)).length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="display text-[1.5rem]">Tags</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Editorial labels that cut across categories — “gift idea”, “under
          2000”, “new in”. Shoppers filter by them in the shop.
        </p>
      </header>

      {error && (
        <p className="flex items-center gap-2.5 rounded-[10px] border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] text-accent">
          <AlertCircle size={16} strokeWidth={1.8} className="shrink-0" />
          {errorMessages[error] ?? "That tag could not be saved."}
        </p>
      )}

      {(saved || removed) && (
        <p className="flex items-center gap-2.5 rounded-[10px] border border-mint-deep bg-mint px-4 py-3 text-[13px] text-mint-ink">
          <CheckCircle2 size={16} strokeWidth={1.8} className="shrink-0" />
          {saved
            ? `Saved “${saved}”.`
            : `Tag deleted${
                removed && removed !== "0"
                  ? ` and taken off ${removed} product${removed === "1" ? "" : "s"}`
                  : ""
              }.`}
        </p>
      )}

      <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
        <h2 className="text-[15px] font-semibold">Add a tag</h2>
        <form action={saveTagAction} className="mt-4 flex flex-wrap gap-2">
          <input
            name="name"
            required
            maxLength={40}
            placeholder="Gift idea"
            aria-label="Tag name"
            className="min-w-0 flex-1 rounded-[10px] border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover"
          >
            <Plus size={15} strokeWidth={2} />
            Add tag
          </button>
        </form>
      </section>

      {tags.length === 0 ? (
        <p className="rounded-tile border border-dashed border-line bg-paper px-5 py-12 text-center text-[13px] text-muted">
          No tags yet. Add one above, then apply it to products from the
          product form.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-tile border border-line bg-paper shadow-card">
          {tags.map((tag) => {
            const used = usage(tag.slug);

            return (
              <li
                key={tag.id}
                className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 sm:px-5"
              >
                <RenameTagRow id={tag.id} name={tag.name} slug={tag.slug} />

                <div className="w-24 shrink-0 text-right">
                  {used > 0 ? (
                    <Link
                      href={`/shop?tag=${tag.slug}`}
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
                  action={deleteTagAction}
                  name="tagId"
                  value={tag.id}
                  label={`Delete ${tag.name}`}
                  confirmLabel="Delete"
                />
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[12px] leading-relaxed text-muted">
        Deleting a tag also takes it off every product carrying it. Renaming one
        keeps its web address, so links you have already shared keep working.
      </p>
    </div>
  );
}
