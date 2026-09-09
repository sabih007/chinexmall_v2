import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Primitives";
import { site } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers on product condition, sourcing, delivery times, WhatsApp orders and returns.",
  alternates: { canonical: "/faq" },
};

/**
 * FAQ content (spec §36).
 *
 * NOTE FOR LAUNCH: the delivery timeframe and return window below are
 * placeholders. Replace them with the business's actual logistics and policy
 * before going live — they also feed the FAQPage structured data.
 */
const faqs = [
  {
    id: "brand-new",
    q: "Are your products brand new?",
    a: "Yes. Every product sold through this store is brand new. We do not sell used, second-hand, refurbished or previously owned items, and we do not grade condition — there is only one condition here, and it is new.",
  },
  {
    id: "sourcing",
    q: "Where are your products sourced?",
    a: "We import directly from suppliers and manufacturers in China. Buying at the source, without middlemen, is what lets us keep prices where they are while still choosing products on quality rather than price alone.",
  },
  {
    id: "nationwide",
    q: "Do you deliver nationwide?",
    a: "Yes. We deliver across the country, including smaller cities and towns served by our courier partners.",
  },
  {
    id: "delivery-time",
    q: "How long does delivery take?",
    a: "Orders are dispatched within 24–48 hours. Delivery typically takes 2–5 working days depending on your city. You will receive a tracking number as soon as your parcel leaves us.",
  },
  {
    id: "free-delivery",
    q: "Is delivery free?",
    a: `Delivery is free on orders over ${site.currency.prefix} ${site.freeShippingThreshold.toLocaleString("en-PK")}. Below that, a flat delivery charge is calculated at checkout.`,
  },
  {
    id: "whatsapp",
    q: "Can I order through WhatsApp?",
    a: "Yes. Every product page has an “Order via WhatsApp” button that opens a chat with the product details already filled in. You can also message us from the floating button in the corner of any page.",
  },
  {
    id: "returns",
    q: "Can I return an item?",
    a: "Unused items in their original packaging can be returned within 7 days of delivery. If something arrives damaged, faulty or incorrect, we collect and replace it at our cost — just message us with a photo.",
  },
  {
    id: "payment",
    q: "What payment methods do you accept?",
    a: "Cash on delivery, bank transfer and card payment. Available options are shown at checkout.",
  },
];

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <Container>
        <div className="py-6">
          <Breadcrumbs items={[{ label: "FAQ" }]} />
        </div>

        <div className="grid gap-12 pb-24 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow text-muted">Help</p>
            <h1 className="display mt-3 text-[1.85rem] sm:text-[2.4rem]">
              Questions,
              <br />
              answered.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Everything people usually ask before their first order. If yours
              is not here, message us — we reply quickly.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="secondary">
                Contact us
              </ButtonLink>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-11 items-center rounded-full rounded-card border border-line px-6 text-[13px] font-medium text-muted transition-colors hover:border-brand hover:text-brand"
              >
                WhatsApp us
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Accordion
              defaultOpen="brand-new"
              items={faqs.map((f) => ({
                id: f.id,
                title: f.q,
                content: <p>{f.a}</p>,
              }))}
            />

            <p className="mt-8 text-[12.5px] text-muted">
              Still stuck?{" "}
              <Link href="/contact" className="underline underline-offset-4 hover:text-ink">
                Send us a message
              </Link>{" "}
              and we will get back to you the same working day.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
