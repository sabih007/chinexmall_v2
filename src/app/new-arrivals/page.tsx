import type { Metadata } from "next";
import { CollectionHero } from "@/components/collections/CollectionHero";
import {
  CollectionView,
  type SearchParamsShape,
} from "@/components/collections/CollectionView";
import { getProducts } from "@/lib/repository";

export const metadata: Metadata = {
  title: "New arrivals",
  description:
    "Just landed — fresh products from our latest imports, added to the store every week.",
  alternates: { canonical: "/new-arrivals" },
};

export default async function NewArrivalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const params = await searchParams;
  const { total } = await getProducts({ newArrival: true });

  return (
    <>
      <CollectionHero
        eyebrow="Just in"
        title="Just landed"
        description="Fresh products, straight from our latest imports. New stock lands every week — this is what arrived most recently."
        crumbs={[{ label: "Shop", href: "/shop" }, { label: "New arrivals" }]}
        count={total}
      />
      <CollectionView
        searchParams={params}
        baseQuery={{ newArrival: true, sort: "newest" }}
        basePath="/new-arrivals"
        emptyMessage="No new arrivals match these filters right now."
      />
    </>
  );
}
