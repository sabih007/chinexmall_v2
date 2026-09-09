import type { Metadata } from "next";
import { CollectionHero } from "@/components/collections/CollectionHero";
import {
  CollectionView,
  type SearchParamsShape,
} from "@/components/collections/CollectionView";
import { getProducts } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Shop all",
  description:
    "Browse every brand-new home, kitchen, lifestyle and gadget find in the store — filter by category, price, colour and availability.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const params = await searchParams;
  const search = Array.isArray(params.q) ? params.q[0] : params.q;
  const { total } = await getProducts({});

  return (
    <>
      <CollectionHero
        eyebrow="Everything"
        title={search ? `Results for “${search}”` : "Shop all"}
        description={
          search
            ? "Matching products from across the store."
            : "Discover our latest collection of everyday finds — brand new, directly imported and smartly priced."
        }
        crumbs={[{ label: "Shop" }]}
        count={search ? undefined : total}
      />

      <CollectionView searchParams={params} basePath="/shop" />
    </>
  );
}
