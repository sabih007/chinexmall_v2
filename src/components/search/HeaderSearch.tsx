"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Result = Pick<Product, "id" | "slug" | "name" | "price" | "stock">;
export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const id = useId();
  const root = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<{ term: string; items: Result[]; total: number; error?: boolean }>({ term: "", items: [], total: 0 });
  const term = query.trim();
  const visible = open && term.length >= 2;
  const pending = result.term !== term;

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=5`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setResult({ term, items: data.items, total: data.total });
      } catch {
        if (!controller.signal.aborted) setResult({ term, items: [], total: 0, error: true });
      }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [term, visible]);

  function browse() {
    if (!term) return;
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  }

  return (
    <form ref={root} onSubmit={(event) => { event.preventDefault(); browse(); }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} role="search" className={cn("relative", className)}>
      <label htmlFor={`${id}-input`} className="sr-only">Search products</label>
      <input id={`${id}-input`} type="search" autoComplete="off" value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} placeholder="Search products, categories and more" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible ? `${id}-results` : undefined} aria-activedescendant={visible && !pending && active >= 0 ? `${id}-option-${active}` : undefined} onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActive(-1); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); setOpen(true);
          if (!pending && result.items.length) setActive((index) => index < 0 ? (event.key === "ArrowDown" ? 0 : result.items.length - 1) : (index + (event.key === "ArrowDown" ? 1 : -1) + result.items.length) % result.items.length);
        }
        if (event.key === "Enter" && visible && !pending && active >= 0 && result.items[active]) {
          event.preventDefault(); setOpen(false); router.push(`/product/${result.items[active].slug}`);
        }
      }} className="h-11 w-full rounded-full border border-line bg-sand pl-4 pr-14 text-sm outline-none focus:border-brand" />
      <button type="submit" aria-label="Search products" className="absolute right-0 top-0 flex h-11 w-12 items-center justify-center rounded-full text-brand"><Search size={19} /></button>
      {visible && <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[60dvh] overflow-y-auto rounded-card border border-line bg-paper p-2 shadow-card-hover">
        <p role="status" className="px-3 py-2 text-xs text-ink-soft">{pending ? "Searching…" : result.error ? "Search is unavailable. Try again shortly." : result.total ? `${result.total} matching products` : "No matches. Try a broader search."}</p>
        <ul id={`${id}-results`} role="listbox" aria-label="Matching products">
          {!pending && !result.error && result.items.map((product, index) => <li key={product.id} role="presentation"><Link id={`${id}-option-${index}`} role="option" aria-selected={active === index} href={`/product/${product.slug}`} onClick={() => setOpen(false)} className={cn("flex min-h-14 items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm hover:bg-brand-soft", active === index && "bg-brand-soft")}><span className="min-w-0"><span className="line-clamp-2 font-medium">{product.name}</span>{product.stock <= 0 && <span className="text-xs text-muted">Out of stock</span>}</span><span className="shrink-0 text-xs font-semibold tabular-nums text-brand">{formatPrice(product.price)}</span></Link></li>)}
        </ul>
        <button type="submit" className="mt-1 flex min-h-11 w-full items-center justify-between rounded-lg border-t border-line px-3 text-xs font-medium text-brand">{!pending && result.items.length ? "View all results" : "Search the shop"}<ArrowRight size={15} /></button>
      </div>}
    </form>
  );
}
