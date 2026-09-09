import { ProductGrid } from "@/components/products/ProductGrid";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { getRelatedProducts } from "@/lib/repository";
import type { Product } from "@/lib/types";

export async function RelatedProducts({ product }: { product: Product }) {
  const related = await getRelatedProducts(product, 4);
  if (related.length === 0) return null;

  return (
    <Section tone="sand">
      <Container>
        <SectionHeading
          eyebrow="Goes well with"
          title="You may also like"
          subtitle="Picked from the same collection and from what other customers bought."
        />
        <ProductGrid products={related} />
      </Container>
    </Section>
  );
}
