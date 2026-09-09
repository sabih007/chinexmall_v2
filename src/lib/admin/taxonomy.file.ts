import "server-only";

import { categories as seedCategories } from "@/data/categories";
import { SWATCH } from "@/data/swatches";
import type { Category, Tag } from "@/lib/types";
import { createJsonStore } from "@/lib/json-store";

/* -------------------------------------------------------------------------- */
/*  Taxonomy — the file backend                                                */
/*                                                                             */
/*  How the catalogue is organised: categories, tags and the colour palette.   */
/*  Categories and colours ship with the store and are overlaid the same way    */
/*  products are — edits shadow the seed, removals are tombstoned, additions    */
/*  are appended — so the starting set is always recoverable. Tags are new to    */
/*  the dashboard, so they simply live here.                                    */
/* -------------------------------------------------------------------------- */

export interface Taxonomy {
  version: 1;
  /** Dashboard-authored categories and edited copies of seed ones, by id. */
  categories: Record<string, Category>;
  /** Seed category ids hidden from the storefront. */
  deletedCategories: string[];
  /** Added or re-pointed colours, `name → hex`. */
  swatches: Record<string, string>;
  /** Seed colour names removed from the palette. */
  deletedSwatches: string[];
  tags: Record<string, Tag>;
  updatedAt: string | null;
}

const EMPTY: Taxonomy = {
  version: 1,
  categories: {},
  deletedCategories: [],
  swatches: {},
  deletedSwatches: [],
  tags: {},
  updatedAt: null,
};

export const newCategoryId = () => mintId("cat_adm");
export const newTagId = () => mintId("tag");

function mintId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1296)
    .toString(36)
    .padStart(2, "0")}`;
}

function isCategory(value: unknown): value is Category {
  const c = value as Partial<Category> | null;
  return (
    !!c &&
    typeof c === "object" &&
    typeof c.id === "string" &&
    typeof c.slug === "string" &&
    typeof c.name === "string"
  );
}

function isTag(value: unknown): value is Tag {
  const t = value as Partial<Tag> | null;
  return (
    !!t &&
    typeof t === "object" &&
    typeof t.id === "string" &&
    typeof t.slug === "string" &&
    typeof t.name === "string"
  );
}

const HEX = /^#[0-9a-fA-F]{3,8}$/;

const store = createJsonStore<Taxonomy>("taxonomy.json", EMPTY, (parsed) => {
  const raw = (parsed ?? {}) as Partial<Taxonomy>;

  const categories: Record<string, Category> = {};
  for (const [id, category] of Object.entries(raw.categories ?? {})) {
    if (isCategory(category)) categories[id] = category;
  }

  const tags: Record<string, Tag> = {};
  for (const [id, tag] of Object.entries(raw.tags ?? {})) {
    if (isTag(tag)) tags[id] = tag;
  }

  const swatches: Record<string, string> = {};
  for (const [name, hex] of Object.entries(raw.swatches ?? {})) {
    if (typeof hex === "string" && HEX.test(hex)) swatches[name] = hex;
  }

  const strings = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string")
      : [];

  return {
    version: 1,
    categories,
    deletedCategories: strings(raw.deletedCategories),
    swatches,
    deletedSwatches: strings(raw.deletedSwatches),
    tags,
    updatedAt: raw.updatedAt ?? null,
  };
});

export function readTaxonomy(): Promise<Taxonomy> {
  return store.read();
}

const seedCategoryIds = new Set(seedCategories.map((c) => c.id));

/* -------------------------------------------------------------------------- */
/*  Reads — the seed with the overlay applied                                 */
/* -------------------------------------------------------------------------- */

export async function listCategories(): Promise<Category[]> {
  const taxonomy = await store.read();

  const base = seedCategories
    .filter((c) => !taxonomy.deletedCategories.includes(c.id))
    .map((c) => taxonomy.categories[c.id] ?? c);

  const authored = Object.values(taxonomy.categories).filter(
    (c) => !seedCategoryIds.has(c.id),
  );

  return [...base, ...authored];
}

export async function listRemovedSeedCategories(): Promise<Category[]> {
  const { deletedCategories } = await store.read();
  return seedCategories.filter((c) => deletedCategories.includes(c.id));
}

export async function listTags(): Promise<Tag[]> {
  const { tags } = await store.read();
  return Object.values(tags);
}

/** The palette: seed colours, minus removals, plus the operator's own. */
export async function listSwatches(): Promise<Record<string, string>> {
  const { swatches, deletedSwatches } = await store.read();

  const palette: Record<string, string> = {};
  for (const [name, hex] of Object.entries(SWATCH)) {
    if (!deletedSwatches.includes(name)) palette[name] = hex;
  }
  return { ...palette, ...swatches };
}

export async function listRemovedSeedSwatches(): Promise<
  { name: string; hex: string }[]
> {
  const { deletedSwatches } = await store.read();
  return Object.entries(SWATCH)
    .filter(([name]) => deletedSwatches.includes(name))
    .map(([name, hex]) => ({ name, hex }));
}

const touch = (taxonomy: Taxonomy) => {
  taxonomy.updatedAt = new Date().toISOString();
};

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export async function saveCategory(category: Category): Promise<void> {
  await store.mutate((taxonomy) => {
    taxonomy.categories[category.id] = category;
    taxonomy.deletedCategories = taxonomy.deletedCategories.filter(
      (id) => id !== category.id,
    );
    touch(taxonomy);
  });
}

export async function deleteCategory(
  id: string,
  { isSeedCategory }: { isSeedCategory: boolean },
): Promise<void> {
  await store.mutate((taxonomy) => {
    delete taxonomy.categories[id];
    if (isSeedCategory && !taxonomy.deletedCategories.includes(id))
      taxonomy.deletedCategories.push(id);
    touch(taxonomy);
  });
}

export async function restoreCategory(id: string): Promise<void> {
  await store.mutate((taxonomy) => {
    taxonomy.deletedCategories = taxonomy.deletedCategories.filter(
      (tombstone) => tombstone !== id,
    );
    touch(taxonomy);
  });
}

/* -------------------------------------------------------------------------- */
/*  Tags                                                                      */
/* -------------------------------------------------------------------------- */

export async function saveTag(tag: Tag): Promise<void> {
  await store.mutate((taxonomy) => {
    taxonomy.tags[tag.id] = tag;
    touch(taxonomy);
  });
}

/** Returns the removed tag's slug, so callers can strip it from products. */
export async function deleteTag(id: string): Promise<string | null> {
  return store.mutate((taxonomy) => {
    const slug = taxonomy.tags[id]?.slug ?? null;
    delete taxonomy.tags[id];
    touch(taxonomy);
    return slug;
  });
}

/* -------------------------------------------------------------------------- */
/*  Colours                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveSwatch(name: string, hex: string): Promise<void> {
  await store.mutate((taxonomy) => {
    taxonomy.swatches[name] = hex;
    taxonomy.deletedSwatches = taxonomy.deletedSwatches.filter(
      (removed) => removed !== name,
    );
    touch(taxonomy);
  });
}

export async function deleteSwatch(
  name: string,
  { isSeedSwatch }: { isSeedSwatch: boolean },
): Promise<void> {
  await store.mutate((taxonomy) => {
    delete taxonomy.swatches[name];
    if (isSeedSwatch && !taxonomy.deletedSwatches.includes(name))
      taxonomy.deletedSwatches.push(name);
    touch(taxonomy);
  });
}

export async function restoreSwatch(name: string): Promise<void> {
  await store.mutate((taxonomy) => {
    taxonomy.deletedSwatches = taxonomy.deletedSwatches.filter(
      (removed) => removed !== name,
    );
    touch(taxonomy);
  });
}
