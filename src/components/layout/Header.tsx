"use client";

import { ArrowUpRight, ChevronDown, Heart, LayoutGrid, Menu, MessageCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HeaderSearch } from "@/components/search/HeaderSearch";
import { AccountLink } from "@/components/account/AccountLink";
import { Logo } from "@/components/layout/Logo";
import { useStore } from "@/components/providers/StoreProvider";
import { Container } from "@/components/ui/Primitives";
import { site } from "@/lib/site";
import type { ShopCategory } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

type NavItem = { label: string; href: string };
export function Header({ categories, links }: { categories: ShopCategory[]; links: NavItem[] }) {
  const pathname = usePathname();
  const { count, wishlist, openCart, openMenu, hydrated } = useStore();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoryButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!categoriesOpen) return;
    const outside = (event: PointerEvent) => {
      if (!categoriesRef.current?.contains(event.target as Node)) setCategoriesOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setCategoriesOpen(false); categoryButton.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [categoriesOpen]);


  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <Container>
        <div className="flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
          <button type="button" onClick={openMenu} aria-label="Open navigation and categories" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"><Menu size={21} /></button>
          <Link href="/" aria-label={`${site.name} home`} className="shrink-0"><Logo priority className="h-6 sm:h-8" /></Link>
          <HeaderSearch className="hidden flex-1 lg:block" />
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <AccountLink />
            <Link href="/wishlist" aria-label="Wishlist" className="relative hidden h-11 w-11 items-center justify-center lg:flex"><Heart size={20} /><CountBubble value={hydrated ? wishlist.length : 0} /></Link>
            <button type="button" onClick={openCart} aria-label={`Cart, ${hydrated ? count : 0} items`} className="relative flex h-11 w-11 items-center justify-center"><ShoppingBag size={20} /><CountBubble value={hydrated ? count : 0} /></button>
          </div>
        </div>
        <HeaderSearch className="mb-3 lg:hidden" />
        <div className="hidden flex-wrap items-center gap-3 pb-3 lg:flex xl:gap-5">
          {categories.length > 0 && <div ref={categoriesRef} className="relative shrink-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCategoriesOpen(false); }}>
            <button ref={categoryButton} type="button" aria-expanded={categoriesOpen} aria-controls="desktop-categories" onClick={() => setCategoriesOpen(!categoriesOpen)} className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-paper"><LayoutGrid size={17} />Shop by category<ChevronDown size={15} className={cn("transition-transform", categoriesOpen && "rotate-180")} /></button>
            {categoriesOpen && <nav id="desktop-categories" aria-label="Product categories" className="absolute left-0 top-full mt-2 max-h-[65vh] w-72 overflow-y-auto rounded-card border border-line bg-paper p-2 shadow-card-hover">
              {categories.map((category) => <Link key={category.id} href={category.href} aria-current={pathname === category.href ? "page" : undefined} onClick={() => setCategoriesOpen(false)} className={cn("flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-brand-soft hover:text-brand", pathname === category.href && "bg-brand-soft text-brand")}><span>{category.label}</span><span className="text-xs text-muted">{category.count}</span></Link>)}
            </nav>}
          </div>}
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
            {links.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setCategoriesOpen(false)} className={cn("rounded-full px-4 py-3 text-sm font-medium transition-colors hover:bg-brand-soft hover:text-brand", pathname === item.href && "bg-brand-soft text-brand")}>{item.label}</Link>)}
          </nav>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="group ml-auto inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full border border-[#13865a] bg-gradient-to-r from-[#087b52] to-[#119761] pl-1.5 pr-3 text-white shadow-[0_4px_12px_-5px_rgba(8,123,82,0.5)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_6px_16px_-5px_rgba(8,123,82,0.6)] motion-safe:hover:-translate-y-0.5" aria-label={`Chat on WhatsApp: ${site.whatsapp.display}`}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15"><MessageCircle size={16} strokeWidth={1.9} /></span>
            <span className="text-[14px] font-semibold tabular-nums">{site.whatsapp.display}</span>
            <ArrowUpRight size={14} className="text-white/80 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
          </a>
        </div>
      </Container>
    </header>
  );
}

function CountBubble({ value }: { value: number }) {
  if (value <= 0) return null;
  return <span className="absolute -right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[12px] font-semibold text-ink">{value}</span>;
}
