import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppFloat } from "@/components/common/WhatsAppFloat";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SearchOverlay } from "@/components/search/SearchOverlay";

/**
 * Everything that wraps a shopper-facing page: announcement bar, header,
 * footer and the overlays (cart, search, mobile nav) that hang off them.
 *
 * It lives in a component rather than the root layout because the admin
 * dashboard shares the root layout but must not inherit any of this chrome.
 * The storefront route group and the global 404 both render it.
 */
export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-xs focus:uppercase focus:tracking-widest focus:text-paper"
      >
        Skip to content
      </a>

      <AnnouncementBar />
      <Header />

      <main id="main">{children}</main>

      <Footer />

      <MobileNav />
      <CartDrawer />
      <SearchOverlay />
      <BottomNav />
      <WhatsAppFloat />
    </StoreProvider>
  );
}
