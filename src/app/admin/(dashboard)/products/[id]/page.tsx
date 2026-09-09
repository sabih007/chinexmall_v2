import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { productToForm } from "@/lib/admin/product-form";
import {
  getCategories,
  getProductById,
  getSwatches,
  getTags,
  isSeedProduct,
} from "@/lib/repository";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: product ? `Edit ${product.name}` : "Product not found" };
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="display text-[1.5rem]">{product.name}</h1>
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-brand hover:underline"
          >
            View on store
            <ExternalLink size={13} strokeWidth={1.8} />
          </Link>
        </div>
        <p className="mt-1.5 text-[13px] text-muted">
          {isSeedProduct(product.id)
            ? "From the starting catalogue. Your edits are saved separately, so the original is never overwritten."
            : "Added from this dashboard."}
        </p>
      </header>

      <ProductForm
        productId={product.id}
        initialValues={productToForm(product, swatches)}
        submitLabel="Save changes"
        options={{ categories, tags, swatches }}
      />
    </div>
  );
}
