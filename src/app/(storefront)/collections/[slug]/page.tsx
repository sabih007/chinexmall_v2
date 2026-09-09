import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHero } from "@/components/collections/CollectionHero";
import {
  CollectionView,
  type SearchParamsShape,
} from "@/components/collections/CollectionView";
import { getCategories, getCategoryBySlug } from "@/lib/repository";
import { site } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsShape>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Collection not found" };

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/collections/${category.slug}` },
    openGraph: {
      type: "website",
      title: `${category.name} — ${site.name}`,
      description: category.description,
      url: `${site.url}/collections/${category.slug}`,
      images: [{ url: category.heroImage, alt: category.name }],
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      <CollectionHero
        eyebrow="Collection"
        title={category.name}
        description={category.description}
        image={category.heroImage}
        crumbs={[{ label: "Shop", href: "/shop" }, { label: category.name }]}
      />

      <CollectionView
        searchParams={resolvedSearchParams}
        baseQuery={{ categories: [category.slug] }}
        facetScope={category.slug}
        hideCategoryFilter
        basePath={`/collections/${category.slug}`}
        emptyMessage={`Nothing in ${category.name} matches these filters right now.`}
      />
    </>
  );
}
