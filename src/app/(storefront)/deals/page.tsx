import type { Metadata } from "next";
import { CollectionHero } from "@/components/collections/CollectionHero";
import {
  CollectionView,
  type SearchParamsShape,
} from "@/components/collections/CollectionView";
import { getProducts } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Deals",
  description:
    "Genuine reductions across home, kitchen, lifestyle and gadgets — while stock lasts.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const params = await searchParams;
  const { total } = await getProducts({ onSale: true });

  return (
    <>
      <CollectionHero
        eyebrow="Limited"
        title="Deals you'll love"
        description="Real reductions on pieces we are restocking or clearing. Every price shown is the price you pay."
        crumbs={[{ label: "Shop", href: "/shop" }, { label: "Deals" }]}
        count={total}
      />
      <CollectionView
        searchParams={params}
        baseQuery={{ onSale: true, sort: "price-asc" }}
        basePath="/deals"
        emptyMessage="No deals match these filters right now."
      />
    </>
  );
}
