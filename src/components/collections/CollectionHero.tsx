import { StoreImage as Image } from "@/components/common/StoreImage";
import { Breadcrumbs, type Crumb } from "@/components/common/Breadcrumbs";
import { Container } from "@/components/ui/Primitives";

/** Collection / listing page header (spec §32). */
export function CollectionHero({
  eyebrow,
  title,
  description,
  image,
  crumbs,
  count,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  image?: string;
  crumbs: Crumb[];
  count?: number;
}) {
  return (
    <>
      <Container>
        <div className="py-6">
          <Breadcrumbs items={crumbs} />
        </div>
      </Container>

      {image ? (
        <Container wide>
          <div className="relative overflow-hidden rounded-tile bg-sand">
            <div className="relative aspect-4/3 w-full sm:aspect-21/9">
              <Image
                src={image}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/75 via-brand-deep/25 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 text-paper sm:p-10 lg:p-14">
              {eyebrow && <p className="eyebrow text-paper/60">{eyebrow}</p>}
              <h1 className="display mt-3 text-[1.85rem] sm:text-[2.4rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-paper/75">
                {description}
              </p>
            </div>
          </div>
        </Container>
      ) : (
        <Container>
          <div className="max-w-2xl pb-2">
            {eyebrow && <p className="eyebrow text-brand">{eyebrow}</p>}
            <h1 className="display mt-3 text-[1.85rem] sm:text-[2.4rem]">
              {title}
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              {description}
            </p>
            {count != null && (
              <p className="mt-4 inline-block rounded-full bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand tabular-nums">
                {count} product{count === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </Container>
      )}

      <div className="h-8 md:h-10" />
    </>
  );
}
