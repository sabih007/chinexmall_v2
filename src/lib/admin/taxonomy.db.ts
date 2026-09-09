import "server-only";

import { requireSupabase } from "@/lib/supabase/client";
import { ensure, fetchAll } from "@/lib/supabase/query";
import { fromCategory, fromTag, toCategory, toTag } from "@/lib/supabase/rows";
import type { Category, Tag } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Taxonomy — the Postgres backend                                            */
/*                                                                             */
/*  Categories, tags and the colour palette, in three small tables. Seed rows   */
/*  are marked and soft-deleted so the dashboard can offer them back, exactly   */
/*  as the overlay does on the file backend.                                    */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export async function listCategories(): Promise<Category[]> {
  const rows = await fetchAll(() =>
    requireSupabase()
      .from("categories")
      .select("*")
      .is("deleted_at", null)
      .order("order", { ascending: true }),
  );

  return rows.map(toCategory);
}

export async function listRemovedSeedCategories(): Promise<Category[]> {
  const rows = await fetchAll(() =>
    requireSupabase()
      .from("categories")
      .select("*")
      .eq("is_seed", true)
      .not("deleted_at", "is", null),
  );

  return rows.map(toCategory);
}

export async function saveCategory(category: Category): Promise<void> {
  const { error } = await requireSupabase()
    .from("categories")
    .upsert({ ...fromCategory(category), deleted_at: null });

  ensure(error);
}

export async function deleteCategory(
  id: string,
  { isSeedCategory }: { isSeedCategory: boolean },
): Promise<void> {
  const db = requireSupabase();

  const { error } = isSeedCategory
    ? await db
        .from("categories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
    : await db.from("categories").delete().eq("id", id);

  ensure(error);
}

export async function restoreCategory(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("categories")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  ensure(error);
}

/* -------------------------------------------------------------------------- */
/*  Tags                                                                      */
/* -------------------------------------------------------------------------- */

export async function listTags(): Promise<Tag[]> {
  const rows = await fetchAll(() =>
    requireSupabase().from("tags").select("*").order("name", { ascending: true }),
  );

  return rows.map(toTag);
}

export async function saveTag(tag: Tag): Promise<void> {
  const { error } = await requireSupabase().from("tags").upsert(fromTag(tag));
  ensure(error);
}

/** Returns the removed tag's slug, so callers can strip it from products. */
export async function deleteTag(id: string): Promise<string | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("tags")
    .delete()
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  ensure(error);
  return typeof data?.slug === "string" ? data.slug : null;
}

/* -------------------------------------------------------------------------- */
/*  Colours                                                                   */
/* -------------------------------------------------------------------------- */

export async function listSwatches(): Promise<Record<string, string>> {
  const rows = await fetchAll(() =>
    requireSupabase()
      .from("swatches")
      .select("*")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  );

  const palette: Record<string, string> = {};
  for (const row of rows) {
    if (typeof row.name === "string" && typeof row.hex === "string") {
      palette[row.name] = row.hex;
    }
  }
  return palette;
}

export async function listRemovedSeedSwatches(): Promise<
  { name: string; hex: string }[]
> {
  const rows = await fetchAll(() =>
    requireSupabase()
      .from("swatches")
      .select("*")
      .eq("is_seed", true)
      .not("deleted_at", "is", null),
  );

  return rows.flatMap((row) =>
    typeof row.name === "string" && typeof row.hex === "string"
      ? [{ name: row.name, hex: row.hex }]
      : [],
  );
}

export async function saveSwatch(name: string, hex: string): Promise<void> {
  const { error } = await requireSupabase().from("swatches").upsert({
    name,
    hex,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  });

  ensure(error);
}

export async function deleteSwatch(
  name: string,
  { isSeedSwatch }: { isSeedSwatch: boolean },
): Promise<void> {
  const db = requireSupabase();

  const { error } = isSeedSwatch
    ? await db
        .from("swatches")
        .update({ deleted_at: new Date().toISOString() })
        .eq("name", name)
    : await db.from("swatches").delete().eq("name", name);

  ensure(error);
}

export async function restoreSwatch(name: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("swatches")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("name", name);

  ensure(error);
}

/* -------------------------------------------------------------------------- */
/*  Import                                                                    */
/* -------------------------------------------------------------------------- */

export async function importCategories(
  categories: Category[],
  { isSeed }: { isSeed: boolean },
): Promise<number> {
  if (categories.length === 0) return 0;

  const { error } = await requireSupabase()
    .from("categories")
    .upsert(
      categories.map((category) => fromCategory(category, { isSeed })),
      { onConflict: "id", ignoreDuplicates: true },
    );

  ensure(error);
  return categories.length;
}

export async function importTags(tags: Tag[]): Promise<number> {
  if (tags.length === 0) return 0;

  const { error } = await requireSupabase()
    .from("tags")
    .upsert(tags.map(fromTag), { onConflict: "id", ignoreDuplicates: true });

  ensure(error);
  return tags.length;
}

export async function importSwatches(
  palette: Record<string, string>,
  { isSeed }: { isSeed: boolean },
): Promise<number> {
  const rows = Object.entries(palette).map(([name, hex]) => ({
    name,
    hex,
    is_seed: isSeed,
  }));
  if (rows.length === 0) return 0;

  const { error } = await requireSupabase()
    .from("swatches")
    .upsert(rows, { onConflict: "name", ignoreDuplicates: true });

  ensure(error);
  return rows.length;
}
