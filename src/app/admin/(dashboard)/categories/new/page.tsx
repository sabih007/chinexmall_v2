import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/admin/categories"
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          ← Categories
        </Link>
        <h1 className="display mt-2 text-[1.5rem]">New category</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          It appears in the filters and the sitemap as soon as you save, and in
          the homepage grid if you feature it.
        </p>
      </header>

      <CategoryForm submitLabel="Create category" />
    </div>
  );
}
