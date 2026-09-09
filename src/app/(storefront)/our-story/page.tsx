import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Reveal } from "@/components/common/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Primitives";
import { photo } from "@/lib/images";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "How we choose what to sell, why we import directly, and what “brand new” means to us.",
  alternates: { canonical: "/our-story" },
};

const steps = [
  {
    number: "01",
    title: "We find it",
    body: "Our team works through supplier catalogues, factory samples and trade shows looking for products that are genuinely useful — not just cheap to buy.",
  },
  {
    number: "02",
    title: "We check it",
    body: "Samples come to us first. If a finish feels wrong, a hinge is flimsy or the packaging will not survive a courier, it does not make the shelf.",
  },
  {
    number: "03",
    title: "We import it directly",
    body: "Ordering straight from the manufacturer removes several layers of margin. That saving is the whole reason our prices look the way they do.",
  },
  {
    number: "04",
    title: "We send it to you",
    body: "Stock is checked again on arrival, then dispatched within 24–48 hours with tracking, anywhere in the country.",
  },
];

export default function OurStoryPage() {
  return (
    <>
      <Container>
        <div className="py-6">
          <Breadcrumbs items={[{ label: "Our story" }]} />
        </div>

        <div className="grid gap-10 pb-16 lg:grid-cols-2 lg:gap-20 lg:pb-24">
          <div>
            <p className="eyebrow text-muted">About {site.shortName}</p>
            <h1 className="display mt-4 text-[2.1rem] sm:text-[2.75rem]">
              Brand new.
              <br />
              Smartly sourced.
              <br />
              Beautifully priced.
            </h1>
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-[16px] leading-relaxed text-ink/80">
              We started with a simple observation: a lot of genuinely clever,
              genuinely useful everyday products never reach local shelves — and
              the ones that do arrive marked up several times over.
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              So we import directly. We choose products the way you would choose
              them for your own home, we check them before they ship, and we
              price them honestly. Nothing we sell is used, refurbished or
              previously owned.
            </p>
          </div>
        </div>
      </Container>

      <Container wide>
        <div className="relative aspect-4/3 overflow-hidden bg-sand sm:aspect-21/9">
          <Image
            src={photo("1522708323590-d24dbb6b0267", 1800)}
            alt="Shelves of neatly arranged home and lifestyle products"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </Container>

      <Section tone="paper" id="direct-import">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow text-muted">Direct import</p>
            <h2 className="display mt-3 text-[1.75rem] sm:text-[2.25rem]">
              How a product gets here.
            </h2>
          </div>

          <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal as="li" key={step.number} delay={i * 0.06}>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-muted tabular-nums">
                  {step.number}
                </p>
                <h3 className="mt-4 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="sand">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div className="relative aspect-4/5 overflow-hidden bg-sand-deep">
              <Image
                src={photo("1584622650111-993a426fbf0a", 1200)}
                alt="Storage boxes stacked in a warehouse aisle"
                fill
                sizes="(min-width:1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>

            <div>
              <p className="eyebrow text-muted">What we promise</p>
              <h2 className="display mt-3 text-[1.75rem] sm:text-[2.25rem]">
                No grey areas.
              </h2>

              <ul className="mt-8 divide-y divide-line border-y border-line">
                {[
                  [
                    "Everything is brand new",
                    "Sealed, unused, and never previously owned.",
                  ],
                  [
                    "The photo is the product",
                    "We shoot and describe what actually arrives.",
                  ],
                  [
                    "The price is the price",
                    "No inflated compare-at prices invented to fake a discount.",
                  ],
                  [
                    "If it is wrong, we fix it",
                    "Damaged or incorrect items are collected and replaced at our cost.",
                  ],
                ].map(([title, body]) => (
                  <li key={title} className="py-5">
                    <h3 className="text-[15px] font-semibold">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] text-muted">{body}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href="/shop" size="lg">
                  Shop the store
                </ButtonLink>
                <ButtonLink href="/contact" variant="secondary" size="lg">
                  Get in touch
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
