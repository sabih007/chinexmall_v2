import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Hero } from "@/components/home/Hero";
import { BestSellers, DealsSection, NewArrivals, TrendingProducts } from "@/components/home/ProductSections";
import { Reviews } from "@/components/home/Reviews";
import { ShoppingAssurance } from "@/components/home/ShoppingAssurance";
import { FreeShippingBanner } from "@/components/home/FreeShippingBanner";
import { RecentlyViewed } from "@/components/products/RecentlyViewed";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  // Catalogue flags, availability, and uploads must reflect the live database,
  // rather than the catalogue available to the build machine.
  await connection();
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FreeShippingBanner />
      <BestSellers />
      <TrendingProducts />
      <ShoppingAssurance />
      <NewArrivals />
      <DealsSection />
      <RecentlyViewed />
      <Reviews />
    </>
  );
}
