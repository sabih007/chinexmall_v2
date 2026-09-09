import "server-only";

import type { Product } from "@/lib/types";
import { createJsonStore } from "./json-store";

/* -------------------------------------------------------------------------- */
/*  Catalogue overlay                                                          */
/*                                                                             */
/*  Products created or edited in the dashboard are persisted as JSON on disk  */
/*  and layered over the seed catalogue by `src/lib/repository.ts`. The seed    */
/*  file is never rewritten, so an edit is always reversible and a bad deploy   */
/*  cannot lose the original catalogue.                                        */
/*                                                                             */
/*  Swapping this for Supabase or Postgres means reimplementing this file and   */
/*  the two calls repository.ts makes into it — nothing else changes.          */
/* -------------------------------------------------------------------------- */

export interface CatalogueOverlay {
  version: 1;
  /** Dashboard-authored products and edited copies of seed products, by id. */
  products: Record<string, Product>;
  /** Seed product ids the operator removed from the storefront. */
  deleted: string[];
  updatedAt: string | null;
}

const EMPTY: CatalogueOverlay = {
  version: 1,
  products: {},
  deleted: [],
  updatedAt: null,
};

/** Ids for dashboard-authored products, so they never collide with `prd_*`. */
export function newProductId(): string {
  return `adm_${Date.now().toString(36)}${Math.floor(Math.random() * 1296)
    .toString(36)
    .padStart(2, "0")}`;
}

/** A hand-edited JSON file should degrade to "no overlay", never crash a page. */
function isProduct(value: unknown): value is Product {
  const p = value as Partial<Product> | null;
  return (
    !!p &&
    typeof p === "object" &&
    typeof p.id === "string" &&
    typeof p.slug === "string" &&
    typeof p.name === "string" &&
    typeof p.price === "number" &&
    Array.isArray(p.images)
  );
}

const store = createJsonStore<CatalogueOverlay>(
  "catalogue.json",
  EMPTY,
  (parsed) => {
    const raw = (parsed ?? {}) as Partial<CatalogueOverlay>;
    const products: Record<string, Product> = {};
    for (const [id, product] of Object.entries(raw.products ?? {})) {
      if (isProduct(product)) products[id] = product;
    }
    return {
      version: 1,
      products,
      deleted: (raw.deleted ?? []).filter(
        (id): id is string => typeof id === "string",
      ),
      updatedAt: raw.updatedAt ?? null,
    };
  },
);

export function readOverlay(): Promise<CatalogueOverlay> {
  return store.read();
}

/** Creates or replaces a product. Editing a seed product shadows it. */
export async function saveProduct(product: Product): Promise<void> {
  await store.mutate((overlay) => {
    overlay.products[product.id] = product;
    overlay.deleted = overlay.deleted.filter((id) => id !== product.id);
    overlay.updatedAt = new Date().toISOString();
  });
}

/**
 * Removes a product from the storefront: dashboard-authored ones are dropped
 * outright, seed ones are tombstoned so they stay out after a redeploy.
 */
export async function deleteProduct(
  id: string,
  { isSeedProduct }: { isSeedProduct: boolean },
): Promise<void> {
  await store.mutate((overlay) => {
    delete overlay.products[id];
    if (isSeedProduct && !overlay.deleted.includes(id)) overlay.deleted.push(id);
    overlay.updatedAt = new Date().toISOString();
  });
}

/**
 * Removes a tag from every product carrying it, so deleting a tag cannot leave
 * products pointing at a label that no longer exists. Returns how many changed.
 */
export async function stripTagFromProducts(slug: string): Promise<number> {
  return store.mutate((overlay) => {
    let changed = 0;
    for (const product of Object.values(overlay.products)) {
      if (!product.tags?.includes(slug)) continue;
      product.tags = product.tags.filter((tag) => tag !== slug);
      changed += 1;
    }
    if (changed > 0) overlay.updatedAt = new Date().toISOString();
    return changed;
  });
}

/** Puts a tombstoned seed product back on the storefront. */
export async function restoreProduct(id: string): Promise<void> {
  await store.mutate((overlay) => {
    overlay.deleted = overlay.deleted.filter((tombstone) => tombstone !== id);
    overlay.updatedAt = new Date().toISOString();
  });
}
