"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { Drawer } from "@/components/ui/Drawer";
import { legalNav, primaryNav, site, socials } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Slide-in navigation for mobile (spec §10). */
export function MobileNav() {
  const { menuOpen, closeMenu } = useStore();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={menuOpen}
      onClose={closeMenu}
      side="left"
      labelledBy="mobile-nav-title"
      headerSlot={
        <span id="mobile-nav-title" className="display text-[17px] font-bold">
          {site.name}
        </span>
      }
      footer={
        <div className="px-5 py-5">
          <p className="mb-3 text-[12px] font-semibold text-ink">Follow us</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full bg-sand px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      }
    >
      <nav aria-label="Mobile" className="px-5 py-3">
        <ul className="divide-y divide-line">
          {primaryNav.map((item) => {
            const open = expanded === item.label;
            return (
              <li key={item.label}>
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex-1 py-4 text-[15px] font-medium",
                      item.emphasis && "text-accent",
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : item.label)}
                      aria-expanded={open}
                      aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`}
                      className="flex h-10 w-10 items-center justify-center text-muted"
                    >
                      <ChevronDown
                        size={16}
                        strokeWidth={1.5}
                        className={cn(
                          "transition-transform duration-300",
                          open && "rotate-180",
                        )}
                      />
                    </button>
                  )}
                </div>

                {item.children && open && (
                  <ul className="mb-3 space-y-1 border-l border-line pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block py-2 text-[13px] text-muted"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <ul className="mt-6 space-y-3 border-t border-line pt-6">
          <li>
            <Link href="/wishlist" className="text-[13px] text-muted">
              Wishlist
            </Link>
          </li>
          <li>
            <Link href="/account" className="text-[13px] text-muted">
              Account
            </Link>
          </li>
          <li>
            <Link href="/faq" className="text-[13px] text-muted">
              FAQ
            </Link>
          </li>
          {legalNav.slice(0, 2).map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-[13px] text-muted">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Drawer>
  );
}
