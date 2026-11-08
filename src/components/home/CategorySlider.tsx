"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Native scrolling keeps swipe and keyboard navigation available without autoplay. */
export function CategorySlider({ children, label = "categories", desktopGrid = false, gridClassName }: { children: ReactNode; label?: string; desktopGrid?: boolean; gridClassName?: string }) {
  const track = useRef<HTMLUListElement>(null);
  const id = useId();
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => setEdges({
      start: element.scrollLeft <= 2,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
    });
    update();
    element.addEventListener("scroll", update, { passive: true });
    if (typeof ResizeObserver === "undefined") return () => element.removeEventListener("scroll", update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => { element.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);

  function slide(direction: number) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <div>
      <div className={cn("mb-4 flex items-center justify-between gap-4", desktopGrid && "sm:hidden")}>
        <p className="text-xs text-ink-soft">Swipe or use the arrows to explore</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => slide(-1)} disabled={edges.start} aria-label={`Previous ${label}`} aria-controls={id} className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-brand hover:bg-brand-soft disabled:cursor-default disabled:opacity-30"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => slide(1)} disabled={edges.end} aria-label={`Next ${label}`} aria-controls={id} className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-brand hover:bg-brand-soft disabled:cursor-default disabled:opacity-30"><ArrowRight size={18} /></button>
        </div>
      </div>
      <ul ref={track} id={id} tabIndex={0} aria-label={label === "categories" ? "Shop by category" : label} className={cn("flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-tile pb-4 [scrollbar-width:thin] [scrollbar-color:var(--color-brand)_var(--color-sand)] sm:gap-4", desktopGrid && "sm:grid sm:snap-none sm:overflow-visible", gridClassName)}>
        {children}
      </ul>
    </div>
  );
}
