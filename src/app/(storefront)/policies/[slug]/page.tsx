import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Container } from "@/components/ui/Primitives";
import { site } from "@/lib/site";

/**
 * Policy pages (spec §40).
 *
 * NOTE FOR LAUNCH: this is starter copy, not legal advice. Have the business
 * review and adapt each policy — particularly return windows, delivery
 * timeframes and the data-handling section — before going live.
 */
interface Policy {
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
}

const policies: Record<string, Policy> = {
  shipping: {
    title: "Shipping policy",
    summary:
      "How and when your order reaches you, and what it costs to get there.",
    sections: [
      {
        heading: "Dispatch",
        body: [
          "Orders placed before 4:00 PM on a working day are dispatched within 24–48 hours. Orders placed at the weekend are dispatched on the next working day.",
          "You will receive a tracking number by SMS or WhatsApp as soon as your parcel leaves our facility.",
        ],
      },
      {
        heading: "Delivery times",
        body: [
          "Major cities: typically 2–3 working days.",
          "Other cities and towns: typically 3–5 working days.",
          "Remote areas may take slightly longer depending on courier coverage.",
        ],
      },
      {
        heading: "Delivery charges",
        body: [
          `Delivery is free on orders over ${site.currency.prefix} ${site.freeShippingThreshold.toLocaleString("en-PK")}.`,
          "Below that threshold, a flat delivery charge is shown at checkout before you confirm your order.",
        ],
      },
      {
        heading: "Failed deliveries",
        body: [
          "Couriers attempt delivery twice. If both attempts fail, the parcel is returned to us and we will contact you to arrange redelivery.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund & returns policy",
    summary: "What to do if something is not right when the box is opened.",
    sections: [
      {
        heading: "Return window",
        body: [
          "Unused items in their original, undamaged packaging can be returned within 7 days of delivery.",
          "Items must include all accessories, manuals and free gifts that came with them.",
        ],
      },
      {
        heading: "Damaged, faulty or incorrect items",
        body: [
          "Message us within 48 hours of delivery with a photo of the item and the packaging.",
          "We arrange collection and send a replacement at our cost. If a replacement is unavailable, we refund in full.",
        ],
      },
      {
        heading: "Non-returnable items",
        body: [
          "For hygiene reasons, personal-care items, grooming devices and opened beauty accessories cannot be returned unless faulty.",
          "Clearance items marked final sale cannot be returned unless faulty.",
        ],
      },
      {
        heading: "Refund timing",
        body: [
          "Approved refunds are issued to the original payment method within 5–7 working days of the returned item reaching us.",
          "Cash-on-delivery orders are refunded by bank transfer.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    summary: "What we collect, why we collect it, and what we never do with it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Order information: name, delivery address, phone number and email address.",
          "Optional information: an email address if you subscribe to our newsletter.",
          "Technical information: basic analytics about how the site is used, so we can improve it.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To process, pack, deliver and support your order.",
          "To send order updates, and — only if you have subscribed — occasional product emails.",
          "To understand which parts of the store are useful and which are not.",
        ],
      },
      {
        heading: "What we do not do",
        body: [
          "We do not sell your personal information.",
          "We do not share your details with anyone other than the courier and payment providers needed to complete your order.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can unsubscribe from marketing email at any time using the link in any message.",
          `You can ask us to correct or delete your information by emailing ${site.email}.`,
        ],
      },
    ],
  },
  terms: {
    title: "Terms of service",
    summary: "The basics of buying from this store.",
    sections: [
      {
        heading: "Products",
        body: [
          "All products sold here are brand new. We do not sell used, refurbished or previously owned goods.",
          "Product photography is representative. Slight variation in colour between screens and physical products is normal.",
        ],
      },
      {
        heading: "Pricing and availability",
        body: [
          "Prices are shown inclusive of applicable taxes and are subject to change without notice.",
          "Compare-at prices reflect a genuine earlier or recommended price, never an invented one.",
          "Stock is limited. If an item sells out after you order, we will contact you and refund in full.",
        ],
      },
      {
        heading: "Orders",
        body: [
          "Placing an order is an offer to buy. We confirm the order when it is dispatched.",
          "We may cancel an order where an item is mispriced, unavailable, or where we suspect fraudulent activity.",
        ],
      },
      {
        heading: "Contact",
        body: [
          `Questions about these terms can be sent to ${site.email} or ${site.whatsapp.display}.`,
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) return { title: "Policy not found" };

  return {
    title: policy.title,
    description: policy.summary,
    alternates: { canonical: `/policies/${slug}` },
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <Container>
      <div className="py-6">
        <Breadcrumbs items={[{ label: policy.title }]} />
      </div>

      <div className="grid gap-12 pb-24 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <h1 className="display text-[1.85rem] sm:text-[2.4rem]">
            {policy.title}
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            {policy.summary}
          </p>
          <p className="mt-6 text-[12.5px] text-muted">
            Last updated · June 2025
          </p>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="divide-y divide-line border-y border-line">
            {policy.sections.map((section) => (
              <section key={section.heading} className="py-7">
                <h2 className="text-[15px] font-semibold">
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-2.5">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[14px] leading-relaxed text-muted"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
