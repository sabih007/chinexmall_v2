import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Category, Tag } from "@/lib/types";
import * as db from "./taxonomy.db";
import * as file from "./taxonomy.file";

/* -------------------------------------------------------------------------- */
/*  Taxonomy store                                                             */
/*                                                                             */
/*  How the catalogue is organised: categories, tags and the colour palette.   */
/*  Postgres when Supabase is configured, the JSON file in `data/` when it is   */
/*  not — see `store.ts` for the same arrangement over products.               */
/* -------------------------------------------------------------------------- */

const backend = () => (isSupabaseConfigured() ? db : file);

export const newCategoryId = file.newCategoryId;
export const newTagId = file.newTagId;

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export function listCategories(): Promise<Category[]> {
  return backend().listCategories();
}

/** Seed categories the operator hid — the dashboard offers them back. */
export function listRemovedSeedCategories(): Promise<Category[]> {
  return backend().listRemovedSeedCategories();
}

export function saveCategory(category: Category): Promise<void> {
  return backend().saveCategory(category);
}

export function deleteCategory(
  id: string,
  options: { isSeedCategory: boolean },
): Promise<void> {
  return backend().deleteCategory(id, options);
}

export function restoreCategory(id: string): Promise<void> {
  return backend().restoreCategory(id);
}

/* -------------------------------------------------------------------------- */
/*  Tags                                                                      */
/* -------------------------------------------------------------------------- */

export function listTags(): Promise<Tag[]> {
  return backend().listTags();
}

export function saveTag(tag: Tag): Promise<void> {
  return backend().saveTag(tag);
}

/** Returns the removed tag's slug, so callers can strip it from products. */
export function deleteTag(id: string): Promise<string | null> {
  return backend().deleteTag(id);
}

/* -------------------------------------------------------------------------- */
/*  Colours                                                                   */
/* -------------------------------------------------------------------------- */

export function listSwatches(): Promise<Record<string, string>> {
  return backend().listSwatches();
}

export function listRemovedSeedSwatches(): Promise<
  { name: string; hex: string }[]
> {
  return backend().listRemovedSeedSwatches();
}

export function saveSwatch(name: string, hex: string): Promise<void> {
  return backend().saveSwatch(name, hex);
}

export function deleteSwatch(
  name: string,
  options: { isSeedSwatch: boolean },
): Promise<void> {
  return backend().deleteSwatch(name, options);
}

export function restoreSwatch(name: string): Promise<void> {
  return backend().restoreSwatch(name);
}
