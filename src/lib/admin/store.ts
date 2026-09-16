import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";
import * as db from "./catalogue.db";
import * as file from "./catalogue.file";

/* -------------------------------------------------------------------------- */
/*  Catalogue store                                                            */
/*                                                                             */
/*  One contract, two backends: Postgres when Supabase is configured, the JSON */
/*  file in `data/` when it is not. Callers — the dashboard's Server Actions    */
/*  and `src/lib/repository.ts` — never learn which is in use.                 */
/*                                                                             */
/*  The choice is made per call rather than at import time, so adding the       */
/*  environment variables and restarting is all it takes to switch.            */
/* -------------------------------------------------------------------------- */

const backend = () => (isSupabaseConfigured() ? db : file);

/** Ids for dashboard-authored products, so they never collide with `prd_*`. */
export const newProductId = file.newProductId;

/** The live catalogue, dashboard-authored products first. */
export function listProducts(): Promise<Product[]> {
  return backend().listProducts();
}

/** Seed products the operator removed — the dashboard offers them back. */
export function listRemovedSeedProducts(): Promise<Product[]> {
  return backend().listRemovedSeedProducts();
}

/** Creates or replaces a product. */
export function saveProduct(product: Product): Promise<void> {
  return backend().saveProduct(product);
}

/**
 * Removes a product from the storefront. A seed product is kept as a tombstone
 * so it stays out after a redeploy, and can be put back.
 */
export function deleteProduct(
  id: string,
  options: { isSeedProduct: boolean },
): Promise<void> {
  return backend().deleteProduct(id, options);
}

/** `deleteProduct` for a selection; `seedIds` says which to tombstone. */
export function deleteProducts(
  ids: string[],
  options: { seedIds: Set<string> },
): Promise<void> {
  return backend().deleteProducts(ids, options);
}

export function restoreProduct(id: string): Promise<void> {
  return backend().restoreProduct(id);
}

/** Returns how many products lost the tag. */
export function stripTagFromProducts(slug: string): Promise<number> {
  return backend().stripTagFromProducts(slug);
}
