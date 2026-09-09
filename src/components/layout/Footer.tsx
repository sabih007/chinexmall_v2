import { Mail, MapPin, PhoneCall } from "lucide-react";
import Link from "next/link";
import { NewsletterForm } from "@/components/home/Newsletter";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Primitives";
import { footerNav, legalNav, site, socials } from "@/lib/site";

/** Full-bleed navy footer, the design's closing block. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-deep text-paper">
      <Container>
        <div className="grid gap-12 py-16 md:grid-cols-12 md:py-20">
          {/* Brand + contact */}
          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" aria-label={`${site.name} home`} className="inline-block">
              <Logo variant="white" className="h-9" />
            </Link>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-paper/70">
              {site.description}
            </p>

            <ul className="mt-8 space-y-3 text-[13px] text-paper/85">
              <li className="flex items-center gap-3">
                <Mail size={15} strokeWidth={1.7} className="shrink-0 text-paper/60" />
                <a href={`mailto:${site.email}`} className="hover:text-paper">
                  {site.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <PhoneCall size={15} strokeWidth={1.7} className="shrink-0 text-paper/60" />
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-paper">
                  {site.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} strokeWidth={1.7} className="mt-0.5 shrink-0 text-paper/60" />
                <span className="max-w-xs leading-relaxed">{site.address}</span>
              </li>
            </ul>

            <p className="mt-8 text-[12px] text-paper/60">Follow us on social media</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-paper text-[12px] font-semibold text-brand transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    {s.label[0]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-4 lg:col-span-7 lg:col-start-6">
            {footerNav.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="mb-5 text-[16px] font-semibold">{column.title}</h2>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-paper/70 transition-colors hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="grid gap-6 rounded-tile bg-paper/10 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="text-[17px] font-semibold">Get the weekly drop</p>
            <p className="mt-1 text-[13px] text-paper/70">
              New arrivals and member-only prices, once a week. No noise.
            </p>
          </div>
          <div className="sm:w-[360px]">
            <NewsletterForm compact invert />
          </div>
        </div>

        {/* Legal */}
        <div className="mt-10 flex flex-col gap-4 border-t border-paper/15 py-7 text-[12px] text-paper/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-paper">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* Clears the mobile bottom navigation */}
      <div className="h-14 lg:hidden" aria-hidden />
    </footer>
  );
}
