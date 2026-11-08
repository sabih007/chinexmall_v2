import { ArrowRight, ArrowUpRight, Banknote, PackageCheck, Sparkles, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { ButtonLink } from "@/components/ui/Button";
import { getProducts } from "@/lib/repository";
import { formatPrice } from "@/lib/format";
import { deliveryMethods, site } from "@/lib/site";

export async function Hero() {
  let { items } = await getProducts({ categories: ["beauty-care"], availability: "in-stock", sort: "featured", limit: 2 });
  if (items.length === 0) {
    ({ items } = await getProducts({ availability: "in-stock", sort: "featured", limit: 2 }));
  }
  const [product, extra] = items;
  const freeDelivery = deliveryMethods.some((method) => method.id === "standard" && method.freeOverThreshold);

  return (
    <section aria-label="Discover ChineXmall" className="pb-3 pt-4 sm:pt-6 lg:pt-8">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[28px] bg-brand-deep text-white sm:rounded-[32px]">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand-deep via-brand-deep to-brand/40" />
          <div aria-hidden className="pointer-events-none absolute -right-44 -top-60 -z-10 h-[650px] w-[650px] rounded-full border border-white/10" />
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-40 -z-10 h-[490px] w-[490px] rounded-full border border-white/5" />

          <div className="grid items-center gap-8 px-6 pb-8 pt-9 sm:px-10 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:p-12 xl:px-16 xl:py-14">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-[10px] font-medium tracking-[0.14em] text-gold sm:text-[11px]"><Sparkles size={13} /> THOUGHTFULLY SELECTED. EVERYDAY USEFUL.</p>
              <h1 className="mt-6 max-w-xl text-[clamp(2.15rem,10vw,2.65rem)] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[3.6rem] xl:text-[4.35rem]">
                Small finds.<br />A little more<br /><span className="font-serif italic font-normal tracking-[-0.025em] text-gold">extraordinary.</span>
              </h1>
              <p className="mt-5 max-w-[25rem] text-sm leading-[1.85] text-white/70 sm:text-[15px]">Thoughtful touches for your home. Clever upgrades for your day. Discover useful things you’ll love living with.</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-8">
                <ButtonLink href="/shop" size="lg" className="group border border-gold bg-gold px-5 text-ink shadow-card hover:bg-gold-hover">Explore the collection <ArrowUpRight size={17} className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" /></ButtonLink>
                <Link href="/best-sellers" className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-white/85 transition-colors hover:text-gold">Discover best sellers <ArrowRight size={15} /></Link>
              </div>
            </div>

            {product && (
              <div className="relative min-w-0 lg:py-3">
                <Link href={`/product/${product.slug}`} className="group block overflow-hidden rounded-[22px] border border-white/20 bg-sand p-2.5 text-ink shadow-[0_24px_60px_-25px_rgba(0,0,0,0.5)] sm:rounded-[26px] sm:p-3">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[15px] bg-white sm:rounded-[18px]">
                    <Image src={product.images[0]} alt={product.name} fill loading="eager" fetchPriority="high" sizes="(min-width:1024px) 42vw, 85vw" className="object-cover object-center transition-transform duration-700 motion-safe:group-hover:scale-[1.04]" />
                    <span className="absolute left-3 top-3 rounded-full border border-line bg-white/95 px-3 py-1.5 text-[10px] font-medium text-ink-soft sm:left-4 sm:top-4">The spotlight edit</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-2 py-4 sm:px-3">
                    <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft">{product.productType}</p><h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h2><p className="mt-1.5 text-sm font-semibold tabular-nums text-brand-deep">{formatPrice(product.price)}</p></div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-deep text-gold transition-colors group-hover:bg-brand"><ArrowUpRight size={20} /></span>
                  </div>
                </Link>
                {extra && <Link href={`/product/${extra.slug}`} className="group mt-3 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 transition-colors hover:bg-white/10">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white"><Image src={extra.thumbnail || extra.images[0]} alt="" fill sizes="48px" className="object-cover" /></div>
                  <div className="min-w-0 flex-1"><p className="text-[10px] text-gold">Another find to explore</p><p className="mt-0.5 truncate text-xs font-medium">{extra.name}</p></div>
                  <span className="shrink-0 text-xs tabular-nums text-white/80">{formatPrice(extra.price)}</span><ArrowUpRight size={15} className="shrink-0 text-white/60" />
                </Link>}
              </div>
            )}
          </div>

          <ul className="grid gap-4 border-t border-white/10 bg-black/10 px-6 py-5 text-xs text-white/75 sm:grid-cols-3 sm:gap-5 sm:px-10 lg:px-12 xl:px-16">
            <li className="flex items-center gap-2.5"><Banknote size={18} strokeWidth={1.5} className="shrink-0 text-gold" />Cash on delivery available</li>
            <li className="flex items-center gap-2.5"><PackageCheck size={18} strokeWidth={1.5} className="shrink-0 text-gold" />Brand-new products</li>
            <li className="flex items-center gap-2.5"><Truck size={18} strokeWidth={1.5} className="shrink-0 text-gold" />{freeDelivery ? `Free standard delivery from ${formatPrice(site.freeShippingThreshold)}` : "Nationwide delivery"}</li>
          </ul>
        </div>
      </Container>
    </section>
  );
}
