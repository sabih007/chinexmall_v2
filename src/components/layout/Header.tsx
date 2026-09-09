"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LayoutGrid,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccountLink } from "@/components/account/AccountLink";
import { Logo } from "@/components/layout/Logo";
import { useStore } from "@/components/providers/StoreProvider";
import { Container } from "@/components/ui/Primitives";
import { categoryNav, primaryNav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Sticky storefront header (spec §09, §10).
 *
 * Two rows on desktop: the shopping bar (wordmark, category picker, search,
 * account and basket) and a navigation bar carrying the mega-menu and the
 * hotline. On mobile it collapses to menu · wordmark · search · basket.
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, wishlist, openCart, openSearch, openMenu, hydrated } =
    useStore();
  const [condensed, setCondensed] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [query, setQuery] = useState("");
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!categoriesOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!categoriesRef.current?.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [categoriesOpen]);

  const activeItem = primaryNav.find((item) => item.label === openMega);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term) router.push(`/shop?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <Container>
        {/* ---- Row one: shopping bar ---- */}
        <div
          className={cn(
            "flex items-center gap-3 transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:gap-5",
            condensed ? "h-14 lg:h-[72px]" : "h-16 lg:h-[88px]",
          )}
        >
          <button
            type="button"
            onClick={openMenu}
            aria-label="Open menu"
            className="-ml-2 flex h-10 w-10 items-center justify-center lg:hidden"
          >
            <Menu size={20} strokeWidth={1.6} />
          </button>

          <Link
            href="/"
            className="shrink-0"
            aria-label={`${site.name} home`}
          >
            <Logo
              priority
              className={cn(
                "transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                condensed ? "h-6 lg:h-7" : "h-7 lg:h-9",
              )}
            />
          </Link>

          {/* Category picker + search — the design's centrepiece */}
          <div className="hidden flex-1 items-center gap-3 lg:flex">
            <div className="relative" ref={categoriesRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen((v) => !v)}
                aria-expanded={categoriesOpen}
                className="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[13px] font-medium transition-colors hover:border-brand"
              >
                <LayoutGrid size={15} strokeWidth={1.7} className="text-brand" />
                All categories
                <ChevronDown
                  size={14}
                  strokeWidth={1.8}
                  className={cn(
                    "text-muted transition-transform duration-300",
                    categoriesOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {categoriesOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-card border border-line bg-paper py-2 shadow-card-hover"
                  >
                    {categoryNav.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setCategoriesOpen(false)}
                          className="block px-4 py-2 text-[13px] text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <form onSubmit={submitSearch} className="relative flex-1" role="search">
              <label htmlFor="header-search" className="sr-only">
                Search products
              </label>
              <input
                id="header-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your product…"
                className="h-11 w-full rounded-full border border-line bg-sand pl-5 pr-[124px] text-[13px] outline-none transition-colors placeholder:text-muted focus:border-brand focus:bg-paper"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 flex h-9 items-center gap-2 rounded-full bg-gold px-5 text-[13px] font-medium text-ink transition-colors hover:bg-gold-hover"
              >
                Search
                <Search size={14} strokeWidth={2} />
              </button>
            </form>
          </div>

          {/* Right — actions */}
          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center transition-colors hover:text-brand lg:hidden"
            >
              <Search size={19} strokeWidth={1.6} />
            </button>

            <AccountLink />

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative hidden h-10 w-10 items-center justify-center transition-colors hover:text-brand lg:flex"
            >
              <Heart size={19} strokeWidth={1.6} />
              <CountBubble value={hydrated ? wishlist.length : 0} />
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              className="relative -mr-1 flex h-10 w-10 items-center justify-center transition-colors hover:text-brand"
            >
              <ShoppingBag size={19} strokeWidth={1.6} />
              <CountBubble value={hydrated ? count : 0} />
            </button>
          </div>
        </div>

        {/* ---- Row two: navigation ---- */}
        <div
          className="hidden items-center gap-4 pb-4 lg:flex"
          onMouseLeave={() => setOpenMega(null)}
        >
          <nav
            aria-label="Primary"
            className="flex items-center gap-1 rounded-full border border-line px-2 py-1.5"
          >
            {primaryNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() =>
                    setOpenMega(item.children ? item.label : null)
                  }
                  onFocus={() => setOpenMega(item.children ? item.label : null)}
                  onClick={() => setOpenMega(null)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                    item.emphasis
                      ? "text-accent hover:bg-accent-soft"
                      : "hover:bg-brand-soft hover:text-brand",
                    active && !item.emphasis && "bg-brand-soft text-brand",
                  )}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      size={13}
                      strokeWidth={2}
                      className={cn(
                        "transition-transform duration-300",
                        openMega === item.label && "rotate-180",
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/deals"
            className="ml-auto flex items-center gap-2 text-[13px] font-medium text-ink-soft transition-colors hover:text-brand"
          >
            <Sparkles size={15} strokeWidth={1.7} className="text-brand" />
            Weekly discounts
          </Link>

          <a
            href={`tel:${site.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-2.5 rounded-full bg-brand py-2 pl-2 pr-5 text-paper transition-colors hover:bg-brand-hover"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/15">
              <Phone size={14} strokeWidth={1.9} />
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] text-paper/70">
                Hotline number
              </span>
              <span className="block text-[13px] font-semibold tabular-nums">
                {site.phone}
              </span>
            </span>
          </a>
        </div>
      </Container>

      {/* Mega menu */}
      <AnimatePresence>
        {activeItem?.children && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onMouseLeave={() => setOpenMega(null)}
            className="absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-card-hover lg:block"
          >
            <Container>
              <div className="flex gap-16 py-8">
                <ul className="grid grid-cols-2 gap-x-16 gap-y-1">
                  {activeItem.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={() => setOpenMega(null)}
                        className="block rounded-full px-3 py-2 text-[13px] text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="ml-auto max-w-xs self-end text-right text-[12px] leading-relaxed text-muted">
                  Brand new, directly imported and quality-checked before it
                  ever reaches your door.
                </p>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Orange count bubble on the wishlist and basket icons. */
function CountBubble({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="absolute -right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-none text-ink tabular-nums">
      {value > 99 ? "99+" : value}
    </span>
  );
}
