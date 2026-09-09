import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductGrid, ProductRail } from "@/components/products/ProductGrid";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { getProducts } from "@/lib/repository";
import type { ProductQuery } from "@/lib/types";

function MoreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[12.5px] font-medium transition-colors hover:border-brand hover:text-brand"
    >
      {label}
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
  layout?: "grid" | "rail";
  tone?: "paper" | "sand";
  id?: string;
}) {
  const { items } = await getProducts(query);
  if (items.length === 0) return null;

  return (
    <Section tone={tone} id={id}>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          action={<MoreLink href={href} label={cta} />}
        />
      </Container>

      {layout === "grid" ? (
        <Container>
          <ProductGrid products={items} columns={5} />
        </Container>
      ) : (
        <Container>
          <ProductRail products={items} />
        </Container>
      )}
    </Section>
  );
}

export function NewArrivals() {
  return (
    <ProductSection
      eyebrow="Just in"
      title="Just landed"
      subtitle="Fresh products, straight from our latest imports."
      query={{ newArrival: true, sort: "newest", limit: 8 }}
      href="/new-arrivals"
      cta="View all new arrivals"
    />
  );
}

export function BestSellers() {
  return (
    <ProductSection
      eyebrow="Proven"
      title="Customer favourites"
      subtitle="The products everyone keeps coming back for."
      query={{ bestSeller: true, sort: "best-selling", limit: 8 }}
      href="/best-sellers"
      cta="Shop best sellers"
      tone="sand"
    />
  );
}

export function TrendingProducts() {
  return (
    <ProductSection
      eyebrow="Right now"
      title="Trending now"
      subtitle="What's making its way into everyone's cart."
      query={{ trending: true, sort: "featured", limit: 8 }}
      href="/shop?trending=true"
      cta="See what's trending"
      layout="rail"
    />
  );
}

export function DealsSection() {
  return (
    <ProductSection
      eyebrow="Limited"
      title="Deals you'll love"
      subtitle="Genuine reductions on pieces we are restocking — while they last."
      query={{ onSale: true, sort: "price-asc", limit: 8 }}
      href="/deals"
      cta="Shop all deals"
      tone="sand"
    />
  );
}
