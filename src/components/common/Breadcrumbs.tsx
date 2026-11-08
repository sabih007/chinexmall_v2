import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { site } from "@/lib/site";

export interface Crumb {
  label: string;
  href?: string;
}

/** Visible breadcrumbs plus matching BreadcrumbList schema (spec §44). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${site.url}${crumb.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
          {trail.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight size={12} strokeWidth={1.5} className="text-line" />
              )}
              {crumb.href && i < trail.length - 1 ? (
                <Link href={crumb.href} className="transition-colors hover:text-brand">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
