"use client";

import { AlertCircle, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveCategoryAction } from "@/app/admin/actions";
import {
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminSection,
  AdminTextarea,
} from "@/components/admin/Fields";
import { SingleImageField } from "@/components/admin/SingleImageField";
import { useDirectUploads } from "@/components/admin/useDirectUploads";
import { Button } from "@/components/ui/Button";
import {
  emptyCategoryForm,
  type CategoryFormErrors,
  type CategoryFormField,
  type CategoryFormValues,
} from "@/lib/admin/category-form";
import { initialCategoryFormState } from "@/lib/admin/form-state";
import { slugify } from "@/lib/admin/product-form";
import { site } from "@/lib/site";

export function CategoryForm({
  categoryId,
  initialValues = emptyCategoryForm,
  submitLabel = "Save category",
}: {
  categoryId?: string;
  initialValues?: CategoryFormValues;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveCategoryAction,
    initialCategoryFormState,
  );
  const uploads = useDirectUploads(formAction);

  const echoed = state.status === "error" ? state.values : undefined;

  return (
    <CategoryFormFields
      key={echoed ? JSON.stringify(echoed) : "initial"}
      categoryId={categoryId}
      initialValues={echoed ?? initialValues}
      initialErrors={state.status === "error" ? state.errors : undefined}
      message={
        uploads.error ??
        (state.status === "error" ? state.message : undefined)
      }
      formAction={formAction}
      onSubmit={(formData) =>
        uploads.submit(formData, ["imageFile", "heroFile"])
      }
      pending={pending || uploads.uploading}
      pendingLabel={uploads.uploading ? "Uploading images…" : "Saving…"}
      submitLabel={submitLabel}
    />
  );
}

function CategoryFormFields({
  categoryId,
  initialValues,
  initialErrors,
  message,
  formAction,
  onSubmit,
  pending,
  pendingLabel,
  submitLabel,
}: {
  categoryId?: string;
  initialValues: CategoryFormValues;
  initialErrors?: CategoryFormErrors;
  message?: string;
  /** What the form posts to without JavaScript. */
  formAction: (formData: FormData) => void;
  /** The JavaScript path: images go to Storage first, then `formAction`. */
  onSubmit: (formData: FormData) => void;
  pending: boolean;
  pendingLabel: string;
  submitLabel: string;
}) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues);
  const [errors, setErrors] = useState<CategoryFormErrors>(initialErrors ?? {});
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.slug));

  function set<K extends CategoryFormField>(
    field: K,
    value: CategoryFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
      className="flex flex-col gap-5 pb-28"
    >
      {categoryId && (
        <input type="hidden" name="categoryId" value={categoryId} />
      )}

      {message && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] text-accent"
        >
          <AlertCircle size={16} strokeWidth={1.8} className="mt-px shrink-0" />
          {message}
        </p>
      )}

      <AdminSection
        title="Basics"
        description="The name shoppers see in the menu, the grid and the breadcrumbs."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Name" htmlFor="name" error={errors.name}>
            <AdminInput
              id="name"
              value={values.name}
              error={errors.name}
              placeholder="Home Décor"
              onChange={(event) => {
                const name = event.target.value;
                setValues((current) => ({
                  ...current,
                  name,
                  slug: slugTouched ? current.slug : slugify(name),
                }));
                setErrors((current) => ({
                  ...current,
                  name: undefined,
                  slug: undefined,
                }));
              }}
            />
          </AdminField>

          <AdminField
            label="Web address"
            htmlFor="slug"
            error={errors.slug}
            hint={`${site.url.replace(/^https?:\/\//, "")}/collections/${values.slug || "…"}`}
          >
            <AdminInput
              id="slug"
              value={values.slug}
              error={errors.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", event.target.value);
              }}
            />
          </AdminField>

          <AdminField
            label="Tagline"
            htmlFor="tagline"
            error={errors.tagline}
            hint="One line under the category name on its card and banner."
            className="sm:col-span-2"
          >
            <AdminInput
              id="tagline"
              value={values.tagline}
              error={errors.tagline}
              maxLength={120}
              placeholder="Small details that make a space feel like home"
              onChange={(event) => set("tagline", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Description"
            htmlFor="description"
            error={errors.description}
            className="sm:col-span-2"
          >
            <AdminTextarea
              id="description"
              rows={4}
              value={values.description}
              error={errors.description}
              placeholder="What belongs in this category, and how it was chosen."
              onChange={(event) => set("description", event.target.value)}
            />
          </AdminField>
        </div>
      </AdminSection>

      <AdminSection
        title="Images"
        description="A square-ish card image, and a wide banner for the collection page."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SingleImageField
            label="Card image"
            name="image"
            fileName="imageFile"
            value={values.image}
            error={errors.image}
            onChange={(value) => set("image", value)}
          />
          <SingleImageField
            label="Banner image"
            name="heroImage"
            fileName="heroFile"
            value={values.heroImage}
            error={errors.heroImage}
            optional
            hint="The card image is used if this is left empty."
            onChange={(value) => set("heroImage", value)}
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Placement"
        description="Where the category sits in the menus, and whether the homepage features it."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Position"
            htmlFor="order"
            error={errors.order}
            optional
            hint="Lower numbers come first. Left empty, it goes to the end."
          >
            <AdminInput
              id="order"
              inputMode="numeric"
              value={values.order}
              error={errors.order}
              onChange={(event) => set("order", event.target.value)}
            />
          </AdminField>

          <AdminCheckbox
            id="featured"
            label="Feature on the homepage"
            description="Shows in the “Shop by category” grid."
            checked={values.featured === "on"}
            onChange={(checked) => set("featured", checked ? "on" : "")}
          />
        </div>
      </AdminSection>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur lg:left-[248px]">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <p className="hidden text-[12px] text-muted sm:block">
            {values.name || "New category"}
          </p>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Link
              href="/admin/categories"
              className="rounded-full px-4 py-2 text-[13px] text-muted transition-colors hover:text-ink"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
              ) : (
                <Save size={15} strokeWidth={1.8} />
              )}
              {pending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
