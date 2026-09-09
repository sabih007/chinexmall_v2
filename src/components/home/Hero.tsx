"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Primitives";
import { formatPrice } from "@/lib/format";
import { photo } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Hero mosaic (spec §12, §13): one large offer panel beside a stack of three
 * smaller promo tiles, each on its own pastel ground.
 */

const HERO_MAIN = photo("1608043152269-423dbba4e7e1", 1200);
const PROMO_TALL = photo("1618221195710-dd6b41faaea6", 800);
const PROMO_ONE = photo("1550581190-9c1c48d21d6c", 600);
const PROMO_TWO = photo("1584589167171-541ce45f1eea", 600);

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease },
        };

  return (
    <section className="pt-6 md:pt-8">
      <Container>
        <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          {/* ---- Main offer panel ---- */}
          <motion.div
            {...rise(0)}
            className="relative overflow-hidden rounded-tile bg-tint-pink px-7 py-10 sm:px-10 sm:py-14 lg:py-16"
          >
            <div className="relative z-10 max-w-[19rem] sm:max-w-[22rem]">
              <span className="inline-flex rounded-full bg-brand px-4 py-1.5 text-[11.5px] font-medium text-paper">
                100% brand new · direct import
              </span>

              <h1 className="display mt-6 text-[2.5rem] leading-[1.05] text-brand-deep sm:text-[3.25rem]">
                Smart gadgets
              </h1>
              <p className="mt-2 text-[1.35rem] font-semibold text-ink-soft sm:text-[1.6rem]">
                for everyday life
              </p>

              <p className="mt-5 text-[15px] text-ink-soft/75">
                Starting at{" "}
                <span className="text-[1.75rem] font-bold text-ink">
                  {formatPrice(899)}
                </span>
              </p>

              <ButtonLink href="/shop" size="lg" className="mt-7">
                Shop now
              </ButtonLink>
            </div>

            {/* Product photography bleeding off the right edge */}
            <div className="pointer-events-none absolute -right-6 bottom-0 top-0 hidden w-[46%] sm:block">
              <Image
                src={HERO_MAIN}
                alt=""
                aria-hidden
                fill
                priority
                sizes="(min-width:1024px) 34vw, 46vw"
                className="object-cover object-center [mask-image:linear-gradient(to_right,transparent,black_45%)]"
              />
            </div>
          </motion.div>

          {/* ---- Promo stack ---- */}
          <div className="grid gap-4">
            <motion.div {...rise(0.1)} className="min-h-[210px]">
              <PromoTile
                href="/new-arrivals"
                image={PROMO_TALL}
                title="New in this week"
                caption="Only"
                price={formatPrice(1299)}
                tone="bg-gradient-to-br from-tint-lilac to-tint-blue"
                titleClass="text-brand-deep"
                tall
              />
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div {...rise(0.18)}>
                <PromoTile
                  href="/deals"
                  image={PROMO_ONE}
                  title="Up to 40% off"
                  caption="This week only"
                  tone="bg-tint-blue"
                  titleClass="text-brand-deep"
                />
              </motion.div>
              <motion.div {...rise(0.26)}>
                <PromoTile
                  href="/collections/kitchen"
                  image={PROMO_TWO}
                  title="Kitchen picks"
                  caption="Everyday essentials"
                  tone="bg-tint-peach"
                  titleClass="text-ink"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PromoTile({
  href,
  image,
  title,
  caption,
  price,
  tone,
  titleClass,
  tall,
}: {
  href: string;
  image: string;
  title: string;
  caption: string;
  price?: string;
  tone: string;
  titleClass: string;
  tall?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-tile p-6",
        tone,
        tall ? "min-h-[210px]" : "min-h-[170px]",
      )}
    >
      <div className="relative z-10 max-w-[62%]">
        <p className={cn("text-[17px] font-semibold leading-snug", titleClass)}>
          {title}
        </p>
        <p className="mt-1.5 text-[12px] text-ink-soft/70">{caption}</p>
        {price && (
          <p className="mt-1 text-[22px] font-bold text-ink">{price}</p>
        )}
      </div>

      <span className="relative z-10 mt-5 inline-flex w-fit items-center rounded-full bg-paper px-4 py-2 text-[12px] font-medium text-ink transition-transform duration-300 group-hover:-translate-y-0.5">
        Shop now
      </span>

      <div className="pointer-events-none absolute -right-2 bottom-0 top-0 w-[42%]">
        <Image
          src={image}
          alt=""
          aria-hidden
          fill
          sizes="(min-width:1024px) 18vw, 40vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] [mask-image:linear-gradient(to_right,transparent,black_55%)]"
        />
      </div>
    </Link>
  );
}
