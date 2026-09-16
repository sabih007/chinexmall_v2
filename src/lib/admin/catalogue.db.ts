import "server-only";

import { requireSupabase } from "@/lib/supabase/client";
import { ensure, fetchAll } from "@/lib/supabase/query";
import { fromProduct, toProduct } from "@/lib/supabase/rows";
import type { Product } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Catalogue — the Postgres backend                                           */
/*                                                                             */
/*  The same contract as `catalogue.file.ts`, against the `products` table.    */
/*  There is no overlay here: the seed catalogue is imported once (see the      */
/*  Database page in the dashboard) and the table is the catalogue from then    */
/*  on. Removing a seed product soft-deletes it, so the dashboard can still     */
/*  offer it back; removing a dashboard-authored one deletes the row.          */
/* -------------------------------------------------------------------------- */

const TABLE = "products";

export async function listProducts(): Promise<Product[]> {
  const rows = await fetchAll(() =>
    requireSupabase()
      .from(TABLE)
      .select("*")
      .is("deleted_at", null)
      /* Dashboard-authored products first, newest first — the same order the
         file backend hands over, so tie-breaks in the storefront do not move
         when a store switches backends. */
      .order("is_seed", { ascending: true })
      .order("created_at", { ascending: false }),
  );

  return rows.map(toProduct);
}

export async function listRemovedSeedProducts(): Promise<Product[]> {
  const rows = await fetchAll(() =>
    requireSupabase()
      .from(TABLE)
      .select("*")
      .eq("is_seed", true)
      .not("deleted_at", "is", null)
      .order("updated_at", { ascending: false }),
  );

  return rows.map(toProduct);
}

/** Creates or replaces a product, and un-deletes it if it was tombstoned. */
export async function saveProduct(product: Product): Promise<void> {
  const { error } = await requireSupabase()
    .from(TABLE)
    .upsert({ ...fromProduct(product), deleted_at: null });

  ensure(error);
}

export async function deleteProduct(
  id: string,
  { isSeedProduct }: { isSeedProduct: boolean },
): Promise<void> {
  const db = requireSupabase();

  const { error } = isSeedProduct
    ? await db
        .from(TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
    : await db.from(TABLE).delete().eq("id", id);

  ensure(error);
}

/** `deleteProduct` for many ids at once: one soft-delete, one hard delete. */
export async function deleteProducts(
  ids: string[],
  { seedIds }: { seedIds: Set<string> },
): Promise<void> {
  const db = requireSupabase();
  const seed = ids.filter((id) => seedIds.has(id));
  const authored = ids.filter((id) => !seedIds.has(id));

  if (seed.length > 0) {
    const { error } = await db
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .in("id", seed);
    ensure(error);
  }

  if (authored.length > 0) {
    const { error } = await db.from(TABLE).delete().in("id", authored);
    ensure(error);
  }
}

export async function restoreProduct(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from(TABLE)
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  ensure(error);
}

/**
 * Removes a tag from every product carrying it, so deleting a tag cannot leave
 * products pointing at a label that no longer exists. Returns how many changed.
 */
export async function stripTagFromProducts(slug: string): Promise<number> {
  const db = requireSupabase();

  const rows = await fetchAll(() =>
    db.from(TABLE).select("id, tags").contains("tags", [slug]),
  );

  let changed = 0;
  for (const row of rows) {
    const tags = Array.isArray(row.tags)
      ? (row.tags as string[]).filter((tag) => tag !== slug)
      : [];

    const { error } = await db
      .from(TABLE)
      .update({ tags, updated_at: new Date().toISOString() })
      .eq("id", row.id as string);

    ensure(error);
    changed += 1;
  }

  return changed;
}

/* -------------------------------------------------------------------------- */
/*  Import                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Writes products into an empty (or partly filled) table without disturbing
 * what an operator has already changed: `ignoreDuplicates` means a product
 * that is already there keeps the row it has.
 */
export async function importProducts(
  products: Product[],
  { isSeed }: { isSeed: boolean },
): Promise<number> {
  if (products.length === 0) return 0;

  const { error } = await requireSupabase()
    .from(TABLE)
    .upsert(
      products.map((product) => fromProduct(product, { isSeed })),
      { onConflict: "id", ignoreDuplicates: true },
    );

  ensure(error);
  return products.length;
}
