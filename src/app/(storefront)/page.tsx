import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Hero } from "@/components/home/Hero";
import { BestSellers, DealsSection, NewArrivals, TrendingProducts } from "@/components/home/ProductSections";
import { Reviews } from "@/components/home/Reviews";
import { ShoppingAssurance } from "@/components/home/ShoppingAssurance";
import { FreeShippingBanner } from "@/components/home/FreeShippingBanner";

export default function HomePage() {
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
      <Reviews />
    </>
  );
}
