import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Container } from "@/components/ui/Primitives";
import { site } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name} — WhatsApp, email or phone.`,
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: site.whatsapp.display,
    href: whatsappLink(),
    note: "Fastest — usually answered within the hour",
    external: true,
  },
  {
    icon: Mail,
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
    note: "Same working day reply",
  },
  {
    icon: Phone,
    label: "Phone",
    value: site.phone,
    href: `tel:${site.phone.replace(/\s/g, "")}`,
    note: site.hours,
  },
];

export default function ContactPage() {
  return (
    <Container>
      <div className="py-6">
        <Breadcrumbs items={[{ label: "Contact" }]} />
      </div>

      <div className="grid gap-12 pb-24 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow text-muted">Contact</p>
          <h1 className="display mt-3 text-[1.85rem] sm:text-[2.4rem]">
            Talk to a
            <br />
            real person.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Questions about a product, an order in transit, or a bulk enquiry —
            whichever channel suits you, someone here will answer.
          </p>

          <div className="mt-10 space-y-1 border-t border-line pt-8">
            <div className="flex items-start gap-3">
              <MapPin size={17} strokeWidth={1.4} className="mt-0.5 shrink-0" />
              <p className="text-[13.5px] leading-relaxed text-muted">
                {site.address}
              </p>
            </div>
            <div className="flex items-start gap-3 pt-4">
              <Clock size={17} strokeWidth={1.4} className="mt-0.5 shrink-0" />
              <p className="text-[13.5px] leading-relaxed text-muted">
                {site.hours}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <ul className="divide-y divide-line border-y border-line">
            {channels.map(({ icon: Icon, ...channel }) => (
              <li key={channel.label}>
                <a
                  href={channel.href}
                  {...(channel.external
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                  className="group flex items-center gap-5 py-6 transition-colors"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card border border-line transition-colors group-hover:border-ink">
                    <Icon size={18} strokeWidth={1.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold text-brand">
                      {channel.label}
                    </span>
                    <span className="mt-1 block truncate text-[15px] font-medium">
                      {channel.value}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-muted">
                      {channel.note}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-10 bg-sand p-6">
            <h2 className="text-[15px] font-semibold">
              Bulk & corporate orders
            </h2>
            <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-muted">
              We supply gifting sets, office fit-outs and event favours at
              volume pricing. Send us a rough quantity and a deadline and we
              will come back with options.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
