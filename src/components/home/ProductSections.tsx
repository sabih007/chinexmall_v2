import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductGrid, ProductRail } from "@/components/products/ProductGrid";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { getProducts } from "@/lib/repository";
import type { ProductQuery, SortKey } from "@/lib/types";

function MoreLink({ href, label, empty = false }: { href: string; label: string; empty?: boolean }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-brand/25 bg-paper px-6 py-2.5 text-sm font-medium text-brand transition-colors hover:border-brand hover:bg-brand-soft"
    >
      {empty ? "Shop all products" : "Show more"}
      <ArrowRight
        size={14}
        strokeWidth={1.8}
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </Link>
  );
}

/**
 * Shared shell for the homepage's merchandised product sections
 * (spec §16, §19, §21, §25). Layout is either a 4-up grid or a swipe rail.
 */
async function ProductSection({
  eyebrow,
  title,
  subtitle,
  query,
  href,
  cta,
  fallback,
  layout = "grid",
  tone = "paper",
  id,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  query: ProductQuery;
  href: string;
  cta: string;
  fallback: { title: string; subtitle: string; sort: SortKey };
  layout?: "grid" | "rail";
  tone?: "paper" | "sand";
  id?: string;
}) {
  let { items } = await getProducts({ ...query, limit: 5 });
  const useFallback = items.length === 0;
  if (useFallback) {
    // Merchandising labels are optional. Never make an existing catalogue
    // disappear just because products have not been assigned those labels.
    ({ items } = await getProducts({ availability: "in-stock", sort: fallback.sort, limit: 5 }));
    if (items.length === 0) {
      // Sold-out products remain visible with disabled purchasing controls.
      ({ items } = await getProducts({ sort: fallback.sort, limit: 5 }));
    }
  }
  const sectionHref = useFallback ? `/shop?sort=${fallback.sort}` : href;

  return (
    <Section tone={tone} id={id}>
      <Container>
        <SectionHeading
          eyebrow={useFallback ? "Discover more" : eyebrow}
          title={useFallback ? fallback.title : title}
          subtitle={useFallback ? fallback.subtitle : subtitle}
        />
      </Container>

      {items.length === 0 ? (
        <Container>
          <div className="rounded-card border border-line bg-paper px-6 py-8 text-center text-sm leading-relaxed text-ink-soft">
            No products are available in this collection right now. Explore the rest of our shop below.
          </div>
        </Container>
      ) : layout === "grid" ? (
        <Container>
          <ProductGrid products={items} columns={5} mobileSlider />
        </Container>
      ) : (
        <Container>
          <ProductRail products={items} />
        </Container>
      )}
      <Container>
        <div className="mt-7 flex justify-center">
          <MoreLink href={items.length ? sectionHref : "/shop"} label={useFallback ? "Browse all products" : cta} empty={!items.length} />
        </div>
      </Container>
    </Section>
  );
}

export function NewArrivals() {
  return (
    <ProductSection
      eyebrow="Just in"
      title="New arrivals"
      subtitle="Fresh products, straight from our latest imports."
      query={{ newArrival: true, availability: "in-stock", sort: "newest" }}
      href="/new-arrivals"
      cta="View all new arrivals"
      fallback={{ title: "Latest in the shop", subtitle: "Explore the latest additions to our catalogue.", sort: "newest" }}
    />
  );
}

export function BestSellers() {
  return (
    <ProductSection
      eyebrow="Discover the favourites"
      title="Hot selling"
      subtitle="Explore our best-seller selection for your home and everyday routine."
      query={{ bestSeller: true, availability: "in-stock", sort: "best-selling" }}
      href="/best-sellers"
      cta="Shop best sellers"
      fallback={{ title: "Explore our collection", subtitle: "Discover products for your home and everyday routine.", sort: "featured" }}
      tone="sand"
    />
  );
}

export function TrendingProducts() {
  return (
    <ProductSection
      eyebrow="Right now"
      title="Trending now"
      subtitle="Discover trending finds from across our catalogue."
      query={{ trending: true, availability: "in-stock", sort: "featured" }}
      href="/shop?trending=true"
      cta="See what's trending"
      fallback={{ title: "Everyday finds", subtitle: "More products from across our catalogue.", sort: "featured" }}
    />
  );
}

export function DealsSection() {
  return (
    <ProductSection
      eyebrow="A little more for less"
      title="Deals you'll love"
      subtitle="Explore products with savings on their regular prices."
      query={{ onSale: true, availability: "in-stock", sort: "price-asc" }}
      href="/deals"
      cta="Shop all deals"
      fallback={{ title: "Finds for every budget", subtitle: "Browse our catalogue, starting with the lowest prices.", sort: "price-asc" }}
      tone="sand"
    />
  );
}
