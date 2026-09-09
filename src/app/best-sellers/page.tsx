import type { Metadata } from "next";
import { CollectionHero } from "@/components/collections/CollectionHero";
import {
  CollectionView,
  type SearchParamsShape,
} from "@/components/collections/CollectionView";
import { getProducts } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Best sellers",
  description:
    "Customer favourites — the products everyone keeps coming back for.",
  alternates: { canonical: "/best-sellers" },
};

export default async function BestSellersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const params = await searchParams;
  const { total } = await getProducts({ bestSeller: true });

  return (
    <>
      <CollectionHero
        eyebrow="Proven"
        title="Customer favourites"
        description="The products everyone keeps coming back for — ranked by what actually leaves the shelf."
        crumbs={[{ label: "Shop", href: "/shop" }, { label: "Best sellers" }]}
        count={total}
      />
      <CollectionView
        searchParams={params}
        baseQuery={{ bestSeller: true, sort: "best-selling" }}
        basePath="/best-sellers"
        emptyMessage="No best sellers match these filters right now."
      />
    </>
  );
}
