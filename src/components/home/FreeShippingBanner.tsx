import { ArrowRight, PackageCheck, Truck } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Primitives";
import { formatPrice } from "@/lib/format";
import { deliveryMethods, site } from "@/lib/site";

export function FreeShippingBanner() {
  const standard = deliveryMethods.find((method) => method.id === "standard");
  if (!standard?.freeOverThreshold) return null;

  return (
    <section aria-labelledby="free-shipping-title" className="pb-10 md:pb-14">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[24px] border border-gold/25 bg-gold-soft p-6 sm:p-9 lg:px-12">
          <div aria-hidden className="pointer-events-none absolute -right-12 -top-24 -z-10 h-80 w-80 rounded-full bg-gold/15" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4 sm:gap-6">
              <div aria-hidden className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-[22px] border border-gold/25 bg-paper/80 text-brand-deep sm:flex"><Truck size={38} strokeWidth={1.5} /></div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand-deep"><PackageCheck size={16} /> Your finds. Delivered free.</p>
                <h2 id="free-shipping-title" className="display max-w-xl text-2xl text-brand-deep sm:text-3xl">Shop for {formatPrice(site.freeShippingThreshold)} or more.<br className="hidden sm:block" /> Get free shipping.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">Free standard delivery nationwide. Applied automatically at checkout.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-4 md:flex-col md:items-start md:gap-3">
              <ButtonLink href="/shop" size="lg">Shop now <ArrowRight size={17} /></ButtonLink>
              <Link href="/policies/shipping" className="text-xs font-medium text-ink-soft underline underline-offset-4 hover:text-brand">Delivery details</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
