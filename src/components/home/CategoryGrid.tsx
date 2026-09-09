import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/common/Reveal";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { BLUR_DATA_URL } from "@/lib/images";
import { getCategories, getCategoryCounts } from "@/lib/repository";
import { cn } from "@/lib/utils";

/**
 * Category bubbles (spec §14, §15) — a round photo on a pastel ground with the
 * product count underneath, the row that sits directly beneath the header in
 * the reference design.
 */

/* Cycled so neighbouring bubbles never share a ground. */
const TINTS = [
  "bg-tint-pink",
  "bg-tint-lemon",
  "bg-tint-blue",
  "bg-tint-green",
  "bg-tint-lilac",
  "bg-tint-peach",
];

export async function CategoryGrid() {
  const [categories, counts] = await Promise.all([
    getCategories({ featuredOnly: true }),
    getCategoryCounts(),
  ]);

  return (
    <Section className="py-10 md:py-14">
      <Container>
        <SectionHeading
          title="Shop by category"
          subtitle="Find something useful, beautiful or simply irresistible."
          action={
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 text-[13px] font-medium text-brand"
            >
              All categories
              <ArrowRight
                size={14}
                strokeWidth={1.9}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          }
        />

        <ul className="grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-4 md:grid-cols-6 md:gap-x-4">
          {categories.map((category, i) => (
            <Reveal as="li" key={category.id} delay={(i % 6) * 0.05}>
              <Link
                href={`/collections/${category.slug}`}
                className="group flex flex-col items-center gap-3 text-center"
              >
                <div
                  className={cn(
                    /* The tint shows as a ring around the photo, so every
                       bubble reads as part of one set. */
                    "relative aspect-square w-full max-w-[92px] rounded-full p-[5px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1",
                    TINTS[i % TINTS.length],
                  )}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    <Image
                      src={category.image}
                      alt=""
                      aria-hidden
                      fill
                      sizes="92px"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-medium leading-snug transition-colors group-hover:text-brand">
                    {category.name}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] text-muted tabular-nums">
                    {counts[category.slug] ?? 0} products
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
