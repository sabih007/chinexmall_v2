/**
 * The shape of the category form, and the rules that turn it into a `Category`.
 *
 * Same arrangement as `product-form.ts`: isomorphic, so the dashboard form and
 * the Server Action validate identically.
 */

import type { Category } from "@/lib/types";
import { isSupportedImageUrl, slugify } from "./product-form";

export interface CategoryFormValues {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  /** Card image on the homepage grid. */
  image: string;
  /** Wide banner at the top of the collection page. */
  heroImage: string;
  featured: string;
  order: string;
}

export type CategoryFormField = keyof CategoryFormValues;
export type CategoryFormErrors = Partial<Record<CategoryFormField, string>>;

export const emptyCategoryForm: CategoryFormValues = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  image: "",
  heroImage: "",
  featured: "",
  order: "",
};

export function categoryToForm(category: Category): CategoryFormValues {
  return {
    name: category.name,
    slug: category.slug,
    tagline: category.tagline,
    description: category.description,
    image: category.image,
    heroImage: category.heroImage,
    featured: category.featured ? "on" : "",
    order: String(category.order),
  };
}

export function readCategoryForm(formData: FormData): CategoryFormValues {
  const values: CategoryFormValues = { ...emptyCategoryForm };
  for (const key of Object.keys(values) as CategoryFormField[]) {
    const raw = formData.get(key);
    if (typeof raw === "string") values[key] = raw;
  }
  return values;
}

export function validateCategoryForm(
  values: CategoryFormValues,
  context: { takenSlugs?: string[] } = {},
): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  const text = (field: CategoryFormField) => values[field].trim();

  if (text("name").length < 2) errors.name = "Give the category a name.";
  else if (text("name").length > 60)
    errors.name = "Keep the name under 60 characters.";

  const slug = text("slug") || slugify(text("name"));
  if (!slug) errors.slug = "The web address cannot be empty.";
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    errors.slug = "Use lowercase letters, numbers and hyphens only.";
  else if (context.takenSlugs?.includes(slug))
    errors.slug = "Another category already uses this web address.";

  if (text("tagline").length < 3)
    errors.tagline = "Add a short line for the category card.";
  else if (text("tagline").length > 120)
    errors.tagline = "Keep the tagline under 120 characters.";

  if (text("description").length < 20)
    errors.description = "Add a description — at least 20 characters.";

  if (!text("image")) errors.image = "Add a card image.";
  else if (!isSupportedImageUrl(text("image")))
    errors.image =
      "Images cannot be loaded from that address. Upload the file instead, or add its domain to images.remotePatterns in next.config.ts.";

  if (text("heroImage") && !isSupportedImageUrl(text("heroImage")))
    errors.heroImage =
      "Images cannot be loaded from that address. Upload the file instead, or add its domain to images.remotePatterns in next.config.ts.";

  const order = Number(text("order"));
  if (text("order") && (!Number.isFinite(order) || order < 0))
    errors.order = "Enter a position of zero or more.";

  return errors;
}

export function buildCategory(
  values: CategoryFormValues,
  context: { id: string; fallbackOrder: number },
): Category {
  const name = values.name.trim();
  const image = values.image.trim();
  const order = Number(values.order.trim());

  return {
    id: context.id,
    name,
    slug: (values.slug.trim() || slugify(name)).toLowerCase(),
    tagline: values.tagline.trim(),
    description: values.description.trim(),
    image,
    /* A collection page always needs a banner; the card image stands in until
       a wider one is uploaded. */
    heroImage: values.heroImage.trim() || image,
    featured: values.featured === "on" || values.featured === "true",
    order: Number.isFinite(order) && values.order.trim() ? order : context.fallbackOrder,
  };
}
