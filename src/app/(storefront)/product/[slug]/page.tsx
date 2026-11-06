import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackViewContent } from "@/components/analytics/MetaEvents";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProductDetail } from "@/components/products/ProductDetail";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { Container } from "@/components/ui/Primitives";
import { discountPercent } from "@/lib/format";
import {
  getAllProductSlugs,
  getCategoryBySlug,
  getProductBySlug,
  getReviewsForProduct,
} from "@/lib/repository";
import { site } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render every product at build time. */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const discount = discountPercent(product.price, product.compareAtPrice);
  const description = `${product.shortDescription}. ${product.description}`.slice(
    0,
    180,
  );

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name}${discount ? ` — ${discount}% off` : ""}`,
      description,
      url: `${site.url}/product/${product.slug}`,
      images: [{ url: product.images[0], alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, productReviews] = await Promise.all([
    getCategoryBySlug(product.category),
    getReviewsForProduct(product.slug),
  ]);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    material: product.material,
    itemCondition: "https://schema.org/NewCondition",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      url: `${site.url}/product/${product.slug}`,
      priceCurrency: site.currency.code,
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(productReviews.length > 0
      ? {
          review: productReviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author },
            datePublished: r.date,
            name: r.title,
            reviewBody: r.body,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
            },
          })),
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />

      {/* Meta Pixel ViewContent. Renders nothing; only the four fields the
          event needs cross to the browser. */}
      <TrackViewContent
        product={{
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
        }}
      />

      <Container>
        <div className="py-6">
          <Breadcrumbs
            items={[
              { label: "Shop", href: "/shop" },
              ...(category
                ? [
                    {
                      label: category.name,
                      href: `/collections/${category.slug}`,
                    },
                  ]
                : []),
              { label: product.name },
            ]}
          />
        </div>

        <div className="pb-16 md:pb-24">
          <ProductDetail product={product} />
        </div>
      </Container>

      <RelatedProducts product={product} />

      {/* Clears the sticky mobile add-to-cart + bottom nav */}
      <div className="h-16 lg:hidden" aria-hidden />
    </>
  );
}
