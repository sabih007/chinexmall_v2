import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Hero } from "@/components/home/Hero";
import { ImportStory } from "@/components/home/ImportStory";
import { Newsletter } from "@/components/home/Newsletter";
import {
  BestSellers,
  DealsSection,
  NewArrivals,
  TrendingProducts,
} from "@/components/home/ProductSections";
import { PromoBanner } from "@/components/home/PromoBanner";
import { Reviews } from "@/components/home/Reviews";
import { ShopTheLook } from "@/components/home/ShopTheLook";
import { SocialSection } from "@/components/home/SocialSection";
import { WhyShop } from "@/components/home/WhyShop";

/**
 * Homepage running the merchandising order from spec §11 — this page sells
 * products first and talks about the business second.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <NewArrivals />
      <BestSellers />
      <PromoBanner />
      <TrendingProducts />
      <WhyShop />
      <ImportStory />
      <ShopTheLook />
      <DealsSection />
      <Reviews />
      <SocialSection />
      <Newsletter />
    </>
  );
}
