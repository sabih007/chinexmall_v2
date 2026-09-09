"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { Container } from "@/components/ui/Primitives";
import { formatPrice } from "@/lib/format";
import { popularSearches } from "@/lib/site";
import type { Product } from "@/lib/types";

/** Full-width instant search (spec §33). */
export function SearchOverlay() {
  const { searchOpen, closeSearch } = useStore();

  return (
    <AnimatePresence>
      {searchOpen && (
        <div
          className="fixed inset-0 z-[85]"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeSearch}
          />

          <motion.div
            className="absolute inset-x-0 top-0 max-h-[92vh] overflow-y-auto rounded-b-tile bg-paper"
            initial={{ y: "-100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Mounted only while open, so the query resets naturally on close. */}
            <SearchPanel onClose={closeSearch} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ResultSet {
  /** The query these results belong to — guards against out-of-order replies. */
  term: string;
  items: Product[];
  total: number;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [data, setData] = useState<ResultSet>({ term: "", items: [], total: 0 });

  const term = query.trim();
  const hasQuery = term.length >= 2;
  const isStale = hasQuery && data.term !== term;

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, []);

  /* Debounced live search against the same API a real backend would expose. */
  useEffect(() => {
    if (term.length < 2) return;

    const controller = new AbortController();
    const id = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}&limit=6`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
        .then((payload: { items?: Product[]; total?: number }) =>
          setData({
            term,
            items: payload.items ?? [],
            total: payload.total ?? 0,
          }),
        )
        .catch(() => {
          /* aborted or offline — the previous results stay on screen */
        });
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [term]);

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <Container>
      {/* Search field */}
      <div className="flex items-center gap-4 border-b border-line py-5">
        <Search size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search for vases, organisers, gadgets…"
            aria-label="Search products"
            className="w-full bg-transparent text-[17px] outline-none placeholder:text-muted sm:text-[20px]"
          />
        </form>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
        >
          <X size={19} strokeWidth={1.5} />
        </button>
      </div>

      <div className="py-8" aria-live="polite">
        {!hasQuery ? (
          <div>
            <p className="eyebrow mb-4 text-muted">Popular searches</p>
            <ul className="flex flex-wrap gap-2">
              {popularSearches.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="rounded-full border border-line px-4 py-2 text-[12.5px] transition-colors hover:border-brand hover:bg-brand hover:text-paper"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : isStale ? (
          <p className="py-6 text-[13px] text-muted">Searching…</p>
        ) : data.items.length === 0 ? (
          <div className="py-6">
            <p className="text-[15px]">No matches for “{term}”.</p>
            <p className="mt-1.5 text-[13px] text-muted">
              Try a broader term, or{" "}
              <Link
                href="/shop"
                onClick={onClose}
                className="underline underline-offset-4"
              >
                browse everything
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <p className="eyebrow mb-5 text-muted">
              {data.total} result{data.total === 1 ? "" : "s"}
            </p>
            <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="group flex items-center gap-4"
                  >
                    <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {product.name}
                      </p>
                      <p className="truncate text-[12px] text-muted">
                        {product.shortDescription}
                      </p>
                      <p className="mt-0.5 text-[12.5px] font-semibold tabular-nums">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => submit(query)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[12.5px] font-medium text-paper transition-colors hover:bg-brand-hover"
            >
              View all results
              <ArrowUpRight size={14} strokeWidth={1.8} />
            </button>
          </>
        )}
      </div>
    </Container>
  );
}
