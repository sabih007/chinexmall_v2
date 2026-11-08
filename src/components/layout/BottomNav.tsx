"use client";

import { Heart, Home, LayoutGrid, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/components/providers/StoreProvider";
import { cn } from "@/lib/utils";

/**
 * App-style bottom navigation for mobile (spec §10, §41). Hidden on desktop
 * and hidden while an overlay is open so it never sits above a drawer.
 */
export function BottomNav() {
  const pathname = usePathname();
  const {
    count,
    wishlist,
    openCart,
    openMenu,
    hydrated,
    cartOpen,
    searchOpen,
    menuOpen,
  } = useStore();

  if (cartOpen || searchOpen || menuOpen || pathname === "/checkout") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const itemClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[12px] font-medium transition-colors",
      active ? "text-brand" : "text-muted",
    );

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="flex h-14 items-stretch">
        <Link href="/" aria-current={isActive("/") ? "page" : undefined} className={itemClass(isActive("/"))}>
          <Home size={18} strokeWidth={1.5} />
          Home
        </Link>

        <Link href="/shop" aria-current={isActive("/shop") ? "page" : undefined} className={itemClass(isActive("/shop"))}>
          <Store size={18} strokeWidth={1.5} />
          Shop
        </Link>

        <button type="button" onClick={openMenu} className={itemClass(isActive("/collections/"))}>
          <LayoutGrid size={18} strokeWidth={1.5} />
          Categories
        </button>

        <Link href="/wishlist" className={itemClass(isActive("/wishlist"))}>
          <span className="relative">
            <Heart size={18} strokeWidth={1.5} />
            {hydrated && wishlist.length > 0 && (
              <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </span>
          Wishlist
        </Link>

        <button type="button" onClick={openCart} className={itemClass(false)}>
          <span className="relative">
            <ShoppingBag size={18} strokeWidth={1.5} />
            {hydrated && count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold leading-none text-ink tabular-nums">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </span>
          Cart
        </button>
      </div>
    </nav>
  );
}
