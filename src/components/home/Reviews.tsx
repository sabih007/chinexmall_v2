import Image from "next/image";
import Link from "next/link";
import { Container, Section, SectionHeading, Rating } from "@/components/ui/Primitives";
import {
  getProductBySlug,
  getReviews,
  reviewsArePlaceholder,
} from "@/lib/repository";
import { formatDate } from "@/lib/format";

/** Customer reviews (spec §35). Horizontal carousel on mobile, grid above. */
export async function Reviews() {
  const reviews = await getReviews(6);

  const cards = await Promise.all(
    reviews.map(async (review) => ({
      review,
      product: await getProductBySlug(review.productSlug),
    })),
  );

  return (
    <Section tone="paper">
      <Container>
        <SectionHeading
          eyebrow="Reviews"
          title="People love their finds"
          subtitle="What customers say once the box is open."
        />

        {reviewsArePlaceholder && (
          <p className="-mt-3 mb-7 inline-block rounded-full bg-gold-soft px-4 py-2 text-[11.5px] font-medium text-ink-soft">
            Sample content — replace with verified reviews before launch
          </p>
        )}

        <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {cards.map(({ review, product }) => (
            <li
              key={review.id}
              className="flex w-[78vw] shrink-0 snap-start flex-col rounded-card border border-line bg-paper p-6 sm:w-auto"
            >
              <Rating value={review.rating} />

              <h3 className="mt-4 text-[14px] font-semibold">{review.title}</h3>
              <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-muted">
                “{review.body}”
              </p>

              <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                {product && (
                  <Link
                    href={`/product/${product.slug}`}
                    className="relative aspect-square w-11 shrink-0 overflow-hidden rounded-lg bg-sand"
                  >
                    <Image
                      src={product.thumbnail}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </Link>
                )}
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium">
                    {review.author}
                    {review.verified && (
                      <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-[10px] font-medium text-mint-ink">
                        Verified
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11.5px] text-muted">
                    {product ? product.name : review.productSlug} ·{" "}
                    {formatDate(review.date)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
