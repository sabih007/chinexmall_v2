"use client";

import { ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerName } from "@/components/account/useCustomerName";
import { Logo } from "@/components/layout/Logo";
import { useStore } from "@/components/providers/StoreProvider";
import { Drawer } from "@/components/ui/Drawer";
import type { ShopCategory } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export function MobileNav({ categories, links }: { categories: ShopCategory[]; links: { label: string; href: string }[] }) {
  const { menuOpen, closeMenu } = useStore();
  const pathname = usePathname();
  const customerName = useCustomerName();
  const linkClass = (href: string) => cn("flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm hover:bg-brand-soft hover:text-brand", pathname === href && "bg-brand-soft font-medium text-brand");
  return (
    <Drawer open={menuOpen} onClose={closeMenu} side="left" labelledBy="mobile-nav-title" headerSlot={<span id="mobile-nav-title" className="flex items-center"><Logo className="h-6" /><span className="sr-only">Navigation</span></span>}>
      <div className="px-4 py-4">
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label={`Chat on WhatsApp: ${site.whatsapp.display}`} className="mb-4 inline-flex min-h-11 items-center gap-2.5 rounded-full border border-[#13865a] bg-gradient-to-r from-[#087b52] to-[#119761] py-1.5 pl-1.5 pr-4 text-white shadow-[0_4px_12px_-5px_rgba(8,123,82,0.5)] transition-all hover:brightness-110"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15"><MessageCircle size={16} strokeWidth={1.9} /></span><span className="text-xs font-semibold tabular-nums">{site.whatsapp.display}</span><ArrowUpRight size={14} className="text-white/80" /></a>
        <nav aria-label="Mobile navigation">
          <ul>{links.map((item) => <li key={item.href}><Link href={item.href} onClick={closeMenu} aria-current={pathname === item.href ? "page" : undefined} className={linkClass(item.href)}>{item.label}<ArrowRight size={15} /></Link></li>)}</ul>
        </nav>
        {categories.length > 0 && <nav aria-label="Mobile product categories" className="mt-5 border-t border-line pt-5">
          <h2 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Shop by category</h2>
          <ul>{categories.map((category) => <li key={category.id}><Link href={category.href} onClick={closeMenu} aria-current={pathname === category.href ? "page" : undefined} className={linkClass(category.href)}><span>{category.label}</span><span className="text-xs text-muted">{category.count}</span></Link></li>)}</ul>
        </nav>}
        <nav aria-label="Account and help" className="mt-5 border-t border-line pt-5">
          {[
            { label: customerName ? "Your account" : "Sign in or create an account", href: customerName ? "/account" : "/account/login" },
            { label: "Wishlist", href: "/wishlist" },
            { label: "Contact us", href: "/contact" },
            { label: "Delivery information", href: "/policies/shipping" },
            { label: "Returns", href: "/policies/refund" },
            { label: "FAQ", href: "/faq" },
          ].map((item) => <Link key={item.href} href={item.href} onClick={closeMenu} className={linkClass(item.href)}>{item.label}</Link>)}
        </nav>
      </div>
    </Drawer>
  );
}
