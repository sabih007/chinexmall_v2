import { Banknote, MessageCircle, Truck } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { deliveryMethods, site } from "@/lib/site";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

export function ShoppingAssurance() {
  const standard = deliveryMethods.find((method) => method.id === "standard")!;
  return (
    <section aria-label="Shopping made simple" className="py-10 md:py-14">
      <Container>
        <div className="grid gap-7 rounded-tile border border-line bg-sand p-6 sm:p-9 md:grid-cols-3 md:gap-10">
          <div><Banknote className="text-brand" size={25} /><h2 className="mt-4 text-base font-semibold">Pay when it arrives</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">Choose cash on delivery at checkout. No upfront payment needed.</p></div>
          <div><Truck className="text-brand" size={25} /><h2 className="mt-4 text-base font-semibold">Delivery, made clear</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">Standard delivery {formatPrice(standard.fee)} · {standard.eta}.{standard.freeOverThreshold && ` Free over ${formatPrice(site.freeShippingThreshold)}.`}</p><Link href="/policies/shipping" className="mt-3 inline-block text-sm font-medium text-brand underline underline-offset-4">Delivery details</Link></div>
          <div><MessageCircle className="text-brand" size={25} /><h2 className="mt-4 text-base font-semibold">A question before ordering?</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">Ask us about a product or your order. We're here to help.</p><a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-brand underline underline-offset-4">Chat on WhatsApp</a></div>
        </div>
      </Container>
    </section>
  );
}
