import "server-only";

import { categories as seedCategories } from "@/data/categories";
import { products as seedProducts } from "@/data/products";
import { SWATCH } from "@/data/swatches";
import { importCustomers } from "@/lib/account/store.db";
import { listCustomers } from "@/lib/account/store.file";
import { requireSupabase } from "@/lib/supabase/client";
import { ensure } from "@/lib/supabase/query";
import type { Category, Product } from "@/lib/types";
import { importProducts } from "./catalogue.db";
import * as catalogueFile from "./catalogue.file";
import { importCoupons } from "./coupons.db";
import { listCoupons as listFileCoupons } from "./coupons.file";
import { importCategories, importSwatches, importTags } from "./taxonomy.db";
import * as taxonomyFile from "./taxonomy.file";

/**
 * Filling a fresh Supabase database.
 *
 * Two things move: the seed catalogue that ships in `src/data`, and whatever a
 * store has already saved to `data/*.json` while it ran on files — so switching
 * to Supabase does not lose a product an operator added last week.
 *
 * Every write is "insert only if that id is not already there". Running this
 * twice is therefore harmless: the second run adds whatever is missing and
 * leaves every row that exists exactly as the dashboard last saved it.
 */

export type ImportCounts = Record<string, number>;

const unique = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export async function importSeedData(): Promise<ImportCounts> {
  /* Fails loudly rather than quietly importing into nothing. */
  requireSupabase();

  const [
    fileProducts,
    removedProducts,
    fileCategories,
    removedCategories,
    fileTags,
    filePalette,
    fileCoupons,
    fileCustomers,
  ] = await Promise.all([
    catalogueFile.listProducts(),
    catalogueFile.listRemovedSeedProducts(),
    taxonomyFile.listCategories(),
    taxonomyFile.listRemovedSeedCategories(),
    taxonomyFile.listTags(),
    taxonomyFile.listSwatches(),
    listFileCoupons(),
    listCustomers(),
  ]);

  /* The dashboard's own copies come first, so a seed product edited there —
     same id, newer content — is the version that lands. */
  const products = unique([...fileProducts, ...removedProducts, ...seedProducts]);
  const categories = unique([
    ...fileCategories,
    ...removedCategories,
    ...seedCategories,
  ]);

  const seedProductIds = new Set(seedProducts.map((p) => p.id));
  const seedCategoryIds = new Set(seedCategories.map((c) => c.id));

  const split = <T extends { id: string }>(items: T[], seedIds: Set<string>) => ({
    seed: items.filter((item) => seedIds.has(item.id)),
    authored: items.filter((item) => !seedIds.has(item.id)),
  });

  const productParts = split<Product>(products, seedProductIds);
  const categoryParts = split<Category>(categories, seedCategoryIds);

  const palette = { seed: {} as Record<string, string>, authored: {} as Record<string, string> };
  for (const [name, hex] of Object.entries(filePalette)) {
    if (name in SWATCH) palette.seed[name] = hex;
    else palette.authored[name] = hex;
  }
  /* A seed colour the operator removed is not in the palette above, so it is
     added back here and tombstoned below — the same as a removed product. */
  for (const [name, hex] of Object.entries(SWATCH)) {
    palette.seed[name] ??= hex;
  }

  const counts: ImportCounts = {
    products:
      (await importProducts(productParts.seed, { isSeed: true })) +
      (await importProducts(productParts.authored, { isSeed: false })),
    categories:
      (await importCategories(categoryParts.seed, { isSeed: true })) +
      (await importCategories(categoryParts.authored, { isSeed: false })),
    tags: await importTags(fileTags),
    swatches:
      (await importSwatches(palette.seed, { isSeed: true })) +
      (await importSwatches(palette.authored, { isSeed: false })),
    coupons: await importCoupons(fileCoupons),
    customers: await importCustomers(fileCustomers),
  };

  /* Tombstones become soft deletes, so a seed product or colour the operator
     removed while on files does not reappear on the storefront. */
  const removedSwatches = await taxonomyFile.listRemovedSeedSwatches();

  counts.removed =
    (await softDelete("products", "id", removedProducts.map((p) => p.id))) +
    (await softDelete("categories", "id", removedCategories.map((c) => c.id))) +
    (await softDelete("swatches", "name", removedSwatches.map((s) => s.name)));

  return counts;
}

async function softDelete(
  table: string,
  key: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;

  const { error } = await requireSupabase()
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .in(key, ids)
    .is("deleted_at", null);

  ensure(error);
  return ids.length;
}
