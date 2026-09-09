import Image from "next/image";
import { Reveal } from "@/components/common/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Primitives";
import { photo } from "@/lib/images";

/** Editorial sourcing story (spec §23). */
export function ImportStory() {
  return (
    <Section tone="sand" id="direct-import">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative aspect-4/3 overflow-hidden rounded-tile bg-sand-deep lg:aspect-4/5">
              <Image
                src={photo("1567538096630-e0c55bd6374c", 1200)}
                alt="Neatly stacked storage boxes in a sourcing warehouse"
                fill
                sizes="(min-width:1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="eyebrow text-brand">Our approach</p>
            <h2 className="display mt-4 text-[1.75rem] sm:text-[2.25rem]">
              Sourced directly.
              <br />
              Priced smarter.
            </h2>

            <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-muted">
              We source products directly from manufacturers and suppliers
              abroad, which lets us find unique everyday products and bring them
              to you at genuinely competitive prices.
            </p>

            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-muted">
              Everything arrives brand new and sealed. Nothing we sell is used,
              refurbished or previously owned — we check each shipment before it
              reaches the shelf.
            </p>

            <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-8">
              {[
                { term: "No middlemen", detail: "Straight from the factory floor" },
                { term: "Checked twice", detail: "At source and on arrival" },
                { term: "Weekly landings", detail: "New stock every week" },
                { term: "Honest pricing", detail: "Better sourcing, not corner-cutting" },
              ].map((item) => (
                <div key={item.term}>
                  <dt className="text-[13px] font-semibold">
                    {item.term}
                  </dt>
                  <dd className="mt-1.5 text-[13px] text-muted">{item.detail}</dd>
                </div>
              ))}
            </dl>

            <ButtonLink href="/our-story" variant="primary" size="lg" className="mt-9">
              Our story
            </ButtonLink>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
