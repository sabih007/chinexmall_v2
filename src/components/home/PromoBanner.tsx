import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/common/Reveal";
import { Container } from "@/components/ui/Primitives";
import { formatPrice } from "@/lib/format";
import { photo } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Three coloured promo tiles across the width (spec §20) — the mid-page
 * interruption between product rows.
 */
const BANNERS = [
  {
    href: "/collections/home-decor",
    title: "Home décor picks",
    caption: "Under one roof",
    price: 1299,
    tone: "bg-gradient-to-br from-tint-lilac to-tint-blue",
    image: photo("1513506003901-1e6a229e2d15", 700),
    button: "bg-paper text-ink",
  },
  {
    href: "/collections/kitchen",
    title: "Kitchen essentials",
    caption: "Everyday useful",
    price: 899,
    tone: "bg-tint-lemon",
    image: photo("1584589167171-541ce45f1eea", 700),
    button: "bg-ink text-paper",
  },
  {
    href: "/collections/gadgets",
    title: "Gadgets & tech",
    caption: "New drops weekly",
    price: 1499,
    tone: "bg-tint-pink",
    image: photo("1526170375885-4d8ecf77b99f", 700),
    button: "bg-brand text-paper",
  },
] as const;

export function PromoBanner() {
  return (
    <section className="py-4">
      <Container>
        <div className="grid gap-4 md:grid-cols-3">
          {BANNERS.map((banner, i) => (
            <Reveal key={banner.href} delay={i * 0.06}>
              <Link
                href={banner.href}
                className={cn(
                  "group relative flex h-full min-h-[178px] flex-col justify-between overflow-hidden rounded-tile p-6",
                  banner.tone,
                )}
              >
                <div className="relative z-10 max-w-[60%]">
                  <p className="text-[17px] font-semibold leading-snug text-brand-deep">
                    {banner.title}
                  </p>
                  <p className="mt-1.5 text-[12px] text-ink-soft/70">
                    {banner.caption}
                  </p>
                  <p className="mt-2 text-[12px] text-ink-soft/70">
                    Only{" "}
                    <span className="text-[20px] font-bold text-ink">
                      {formatPrice(banner.price)}
                    </span>
                  </p>
                </div>

                <span
                  className={cn(
                    "relative z-10 mt-5 inline-flex w-fit items-center rounded-full px-4 py-2 text-[12px] font-medium transition-transform duration-300 group-hover:-translate-y-0.5",
                    banner.button,
                  )}
                >
                  Shop now
                </span>

                <div className="pointer-events-none absolute -right-2 bottom-0 top-0 w-[44%]">
                  <Image
                    src={banner.image}
                    alt=""
                    aria-hidden
                    fill
                    sizes="(min-width:768px) 16vw, 44vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] [mask-image:linear-gradient(to_right,transparent,black_55%)]"
                  />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
