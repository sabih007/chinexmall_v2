"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { passwordMatches, isAdminConfigured } from "@/lib/admin/auth";
import {
  buildCoupon,
  readCouponForm,
  validateCouponForm,
} from "@/lib/admin/coupon-form";
import {
  buildCategory,
  readCategoryForm,
  validateCategoryForm,
} from "@/lib/admin/category-form";
import {
  deleteCoupon,
  findCouponById,
  newCouponId,
  saveCoupon,
} from "@/lib/admin/coupons-store";
import type {
  CategoryFormState,
  CouponFormState,
  LoginState,
  ProductFormState,
} from "@/lib/admin/form-state";
import {
  MAX_IMAGES,
  buildProduct,
  readProductForm,
  slugify,
  toLines,
  validateProductForm,
  type ProductFormValues,
} from "@/lib/admin/product-form";
import {
  endAdminSession,
  requireAdmin,
  startAdminSession,
} from "@/lib/admin/session";
import {
  deleteProduct,
  newProductId,
  restoreProduct,
  saveProduct,
  stripTagFromProducts,
} from "@/lib/admin/store";
import {
  deleteCategory,
  deleteSwatch,
  deleteTag,
  newCategoryId,
  newTagId,
  restoreCategory,
  restoreSwatch,
  saveCategory,
  saveSwatch,
  saveTag,
} from "@/lib/admin/taxonomy-store";
import { UploadError, saveUploadedImages } from "@/lib/admin/uploads";
import {
  getCatalogue,
  getCategories,
  getCoupons,
  getProductById,
  getSwatches,
  getTags,
  isSeedCategory,
  isSeedProduct,
  isSeedSwatch,
} from "@/lib/repository";

/**
 * Every mutation the dashboard performs.
 *
 * Server Actions are reachable by direct POST, not only through the dashboard
 * UI, so each one re-checks the session itself — `proxy.ts` is a convenience,
 * not the guard.
 */

/** Storefront pages read the catalogue, so a saved product invalidates them all. */
function revalidateStorefront() {
  revalidatePath("/", "layout");
}

/* -------------------------------------------------------------------------- */
/*  Sign in / out                                                             */
/* -------------------------------------------------------------------------- */

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAdminConfigured()) {
    return {
      message:
        "No admin password is set. Add ADMIN_PASSWORD to .env.local and restart the server.",
    };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !(await passwordMatches(password))) {
    return { message: "That password is not right." };
  }

  await startAdminSession();

  // Only ever bounce back into the dashboard — never to a caller-supplied host.
  const next = formData.get("next");
  const destination =
    typeof next === "string" && /^\/admin(?:\/|$)/.test(next) ? next : "/admin";

  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

/** Keeps the first occurrence of each image, capped at `MAX_IMAGES`. */
function mergeImages(existing: string[], uploaded: string[]): string[] {
  return [...new Set([...existing, ...uploaded])].slice(0, MAX_IMAGES);
}

export async function saveProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const values = readProductForm(formData);
  const editingId = formData.get("productId");
  const existing =
    typeof editingId === "string" && editingId
      ? await getProductById(editingId)
      : null;

  if (typeof editingId === "string" && editingId && !existing) {
    return {
      status: "error",
      message: "That product no longer exists.",
      values,
    };
  }

  let uploaded: string[] = [];
  try {
    uploaded = await saveUploadedImages(
      formData.getAll("photos").filter((v): v is File => v instanceof File),
    );
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof UploadError
          ? error.message
          : "Those photos could not be saved.",
      values,
    };
  }

  const images = mergeImages(toLines(values.imageUrls), uploaded);
  const submitted: ProductFormValues = {
    ...values,
    imageUrls: images.join("\n"),
  };

  const [catalogue, categories, tags, swatches] = await Promise.all([
    getCatalogue(),
    getCategories(),
    getTags(),
    getSwatches(),
  ]);

  const errors = validateProductForm(submitted, {
    categorySlugs: categories.map((c) => c.slug),
    tagSlugs: tags.map((t) => t.slug),
    takenSlugs: catalogue
      .filter((p) => p.id !== existing?.id)
      .map((p) => p.slug),
    imageCount: images.length,
  });

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors,
      values: submitted,
    };
  }

  const product = buildProduct(submitted, {
    id: existing?.id ?? newProductId(),
    images,
    swatches,
    createdAt: existing?.createdAt,
  });

  await saveProduct(product);
  revalidateStorefront();

  redirect(`/admin/products?saved=${encodeURIComponent(product.slug)}`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("productId");
  if (typeof id !== "string" || !id) return;

  await deleteProduct(id, { isSeedProduct: isSeedProduct(id) });
  revalidateStorefront();

  redirect("/admin/products?removed=1");
}

export async function restoreProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("productId");
  if (typeof id !== "string" || !id) return;

  await restoreProduct(id);
  revalidateStorefront();

  redirect("/admin/products?restored=1");
}

/* -------------------------------------------------------------------------- */
/*  Coupons                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveCouponAction(
  _previous: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  await requireAdmin();

  const values = readCouponForm(formData);
  const editingId = formData.get("couponId");
  const existing =
    typeof editingId === "string" && editingId
      ? await findCouponById(editingId)
      : null;

  if (typeof editingId === "string" && editingId && !existing) {
    return { status: "error", message: "That coupon no longer exists.", values };
  }

  const errors = validateCouponForm(values, {
    takenCodes: (await getCoupons())
      .filter((c) => c.id !== existing?.id)
      .map((c) => c.code),
  });

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors,
      values,
    };
  }

  const coupon = buildCoupon(values, {
    id: existing?.id ?? newCouponId(),
    usedCount: existing?.usedCount,
    createdAt: existing?.createdAt,
  });

  await saveCoupon(coupon);
  // Coupons are read at checkout time, not baked into a page, so only the
  // dashboard's own listing needs refreshing.
  revalidatePath("/admin/coupons");

  redirect(`/admin/coupons?saved=${encodeURIComponent(coupon.code)}`);
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("couponId");
  if (typeof id !== "string" || !id) return;

  await deleteCoupon(id);
  revalidatePath("/admin/coupons");

  redirect("/admin/coupons?removed=1");
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export async function saveCategoryAction(
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const values = readCategoryForm(formData);
  const editingId = formData.get("categoryId");
  const categories = await getCategories();
  const existing =
    typeof editingId === "string" && editingId
      ? (categories.find((c) => c.id === editingId) ?? null)
      : null;

  if (typeof editingId === "string" && editingId && !existing) {
    return {
      status: "error",
      message: "That category no longer exists.",
      values,
    };
  }

  /* Uploads first: a rejected form should not lose the photos it carried. */
  let card: string[] = [];
  let hero: string[] = [];
  try {
    [card, hero] = await Promise.all([
      saveUploadedImages(
        formData.getAll("imageFile").filter((v): v is File => v instanceof File),
      ),
      saveUploadedImages(
        formData.getAll("heroFile").filter((v): v is File => v instanceof File),
      ),
    ]);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof UploadError
          ? error.message
          : "Those images could not be saved.",
      values,
    };
  }

  const submitted = {
    ...values,
    image: card[0] ?? values.image,
    heroImage: hero[0] ?? values.heroImage,
  };

  const errors = validateCategoryForm(submitted, {
    takenSlugs: categories
      .filter((c) => c.id !== existing?.id)
      .map((c) => c.slug),
  });

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors,
      values: submitted,
    };
  }

  const category = buildCategory(submitted, {
    id: existing?.id ?? newCategoryId(),
    fallbackOrder:
      existing?.order ??
      Math.max(0, ...categories.map((c) => c.order)) + 1,
  });

  await saveCategory(category);
  revalidateStorefront();

  redirect(`/admin/categories?saved=${encodeURIComponent(category.name)}`);
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("categoryId");
  if (typeof id !== "string" || !id) return;

  const [categories, catalogue] = await Promise.all([
    getCategories(),
    getCatalogue(),
  ]);
  const category = categories.find((c) => c.id === id);
  if (!category) redirect("/admin/categories");

  /* Refused rather than cascaded: hiding a category whose products are still
     for sale would strand them on a collection page that 404s. */
  const inUse = catalogue.filter((p) => p.category === category.slug).length;
  if (inUse > 0) {
    redirect(
      `/admin/categories?blocked=${encodeURIComponent(category.name)}&count=${inUse}`,
    );
  }

  await deleteCategory(id, { isSeedCategory: isSeedCategory(id) });
  revalidateStorefront();

  redirect("/admin/categories?removed=1");
}

export async function restoreCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("categoryId");
  if (typeof id !== "string" || !id) return;

  await restoreCategory(id);
  revalidateStorefront();

  redirect("/admin/categories?restored=1");
}

/* -------------------------------------------------------------------------- */
/*  Tags                                                                      */
/* -------------------------------------------------------------------------- */

export async function saveTagAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const id = String(formData.get("tagId") ?? "").trim();
  if (!name) redirect("/admin/tags?error=empty");

  const slug = slugify(name);
  if (!slug) redirect("/admin/tags?error=slug");

  const tags = await getTags();
  const clash = tags.find((t) => t.slug === slug && t.id !== id);
  if (clash) redirect(`/admin/tags?error=taken&name=${encodeURIComponent(name)}`);

  const existing = id ? tags.find((t) => t.id === id) : undefined;
  if (id && !existing) redirect("/admin/tags");

  /* Renaming keeps the slug: products store slugs, and re-pointing every
     product to a new one would be a silent rewrite of the catalogue. */
  await saveTag({
    id: existing?.id ?? newTagId(),
    name,
    slug: existing?.slug ?? slug,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });

  revalidateStorefront();
  redirect(`/admin/tags?saved=${encodeURIComponent(name)}`);
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("tagId");
  if (typeof id !== "string" || !id) return;

  const slug = await deleteTag(id);
  const stripped = slug ? await stripTagFromProducts(slug) : 0;

  revalidateStorefront();
  redirect(`/admin/tags?removed=${stripped}`);
}

/* -------------------------------------------------------------------------- */
/*  Colours                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveSwatchAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = slugify(String(formData.get("name") ?? ""));
  const hex = String(formData.get("hex") ?? "").trim();

  if (!name) redirect("/admin/colours?error=name");
  if (!/^#[0-9a-fA-F]{3,8}$/.test(hex)) redirect("/admin/colours?error=hex");

  await saveSwatch(name, hex.toUpperCase());
  revalidateStorefront();

  redirect(`/admin/colours?saved=${encodeURIComponent(name)}`);
}

export async function deleteSwatchAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = formData.get("name");
  if (typeof name !== "string" || !name) return;

  await deleteSwatch(name, { isSeedSwatch: isSeedSwatch(name) });
  revalidateStorefront();

  redirect("/admin/colours?removed=1");
}

export async function restoreSwatchAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = formData.get("name");
  if (typeof name !== "string" || !name) return;

  await restoreSwatch(name);
  revalidateStorefront();

  redirect("/admin/colours?restored=1");
}
