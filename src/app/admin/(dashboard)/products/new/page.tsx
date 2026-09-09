import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { emptyProductForm } from "@/lib/admin/product-form";
import { getCategories, getSwatches, getTags } from "@/lib/repository";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const [categories, tags, swatches] = await Promise.all([
    getCategories(),
    getTags(),
    getSwatches(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/admin/products"
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          ← Products
        </Link>
        <h1 className="display mt-2 text-[1.5rem]">Add a product</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          It goes live on the storefront the moment you save.
        </p>
      </header>

      <ProductForm
        submitLabel="Publish product"
        initialValues={{
          ...emptyProductForm,
          category: categories[0]?.slug ?? "",
        }}
        options={{ categories, tags, swatches }}
      />
    </div>
  );
}
