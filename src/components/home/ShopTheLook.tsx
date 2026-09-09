import { Reveal } from "@/components/common/Reveal";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { getLookProducts, getLooks } from "@/lib/repository";
import { LookBoard } from "./LookBoard";

/** Lifestyle "shop the look" magazine section (spec §24). */
export async function ShopTheLook() {
  const looks = await getLooks();
  const boards = await Promise.all(
    looks.map(async (look) => ({
      look,
      slots: await getLookProducts(look),
    })),
  );

  const usable = boards.filter((b) => b.slots.length > 0);
  if (usable.length === 0) return null;

  return (
    <Section tone="paper">
      <Container>
        <SectionHeading
          eyebrow="Shop the look"
          title="Styled, not staged"
          subtitle="Real rooms built from pieces you can add to your cart. Tap a marker to shop it."
        />

        <Reveal>
          <LookBoard boards={usable} />
        </Reveal>
      </Container>
    </Section>
  );
}
