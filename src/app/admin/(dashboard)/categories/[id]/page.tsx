import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { categoryToForm } from "@/lib/admin/category-form";
import { getCatalogue, getCategories, isSeedCategory } from "@/lib/repository";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const category = (await getCategories()).find((c) => c.id === id);
  return { title: category ? `Edit ${category.name}` : "Category not found" };
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const [categories, catalogue] = await Promise.all([
    getCategories(),
    getCatalogue(),
  ]);

  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const used = catalogue.filter((p) => p.category === category.slug).length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/admin/categories"
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          ← Categories
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="display text-[1.5rem]">{category.name}</h1>
          <Link
            href={`/collections/${category.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-brand hover:underline"
          >
            View on store
            <ExternalLink size={13} strokeWidth={1.8} />
          </Link>
        </div>
        <p className="mt-1.5 text-[13px] text-muted">
          {used} product{used === 1 ? "" : "s"} filed here ·{" "}
          {isSeedCategory(category.id)
            ? "from the starting set, so your edits are saved separately"
            : "added from this dashboard"}
        </p>
      </header>

      <CategoryForm
        categoryId={category.id}
        initialValues={categoryToForm(category)}
        submitLabel="Save changes"
      />
    </div>
  );
}
