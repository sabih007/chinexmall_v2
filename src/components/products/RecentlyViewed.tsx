"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "./ProductGrid";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { readRecentlyViewed, rememberProduct, RECENTLY_VIEWED_KEY } from "@/lib/recently-viewed";
import type { Product } from "@/lib/types";

export function RecentlyViewed({ currentSlug }: { currentSlug?: string }) {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    let history: string[];
    try {
      history = readRecentlyViewed(localStorage.getItem(RECENTLY_VIEWED_KEY));
      if (currentSlug) localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(rememberProduct(history, currentSlug)));
    } catch { return; }
    const slugs = history.filter((slug) => slug !== currentSlug).slice(0, 5);
    if (slugs.length) {
      const params = new URLSearchParams();
      slugs.forEach((slug) => params.append("slug", slug));
      void fetch(`/api/recently-viewed?${params}`, { signal: controller.signal })
        .then((response) => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
        .then((data: { items: Product[] }) => { if (!controller.signal.aborted) setItems(data.items); })
        .catch(() => { /* Optional browsing history never interrupts shopping. */ });
    }
    return () => controller.abort();
  }, [currentSlug]);
  const visible = items.filter((product) => product.slug !== currentSlug);
  if (!visible.length) return null;
  return (
    <Section>
      <Container>
        <SectionHeading title="Recently viewed" subtitle="Pick up where you left off." action={<button type="button" onClick={() => { try { localStorage.removeItem(RECENTLY_VIEWED_KEY); } catch { /* Storage may be unavailable. */ } setItems([]); }} className="min-h-11 text-xs font-medium text-ink-soft underline underline-offset-4 hover:text-brand">Clear history</button>} />
        <ProductGrid products={visible} columns={5} />
      </Container>
    </Section>
  );
}
