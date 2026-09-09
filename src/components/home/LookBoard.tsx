"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatPrice } from "@/lib/format";
import type { Look, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Slot {
  x: number;
  y: number;
  product: Product;
}

/**
 * Tabbed lifestyle boards with shoppable hotspots. Each marker opens a small
 * product card; the card's button adds straight to the cart.
 */
export function LookBoard({
  boards,
}: {
  boards: { look: Look; slots: Slot[] }[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const { addToCart } = useStore();

  const board = boards[activeIndex];

  return (
    <div>
      {/* Look switcher */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {boards.map((b, i) => (
          <button
            key={b.look.id}
            type="button"
            onClick={() => {
              setActiveIndex(i);
              setOpenSlot(null);
            }}
            aria-pressed={i === activeIndex}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[12.5px] font-medium transition-colors",
              i === activeIndex
                ? "border-brand bg-brand text-paper"
                : "border-line text-muted hover:border-brand hover:text-brand",
            )}
          >
            {b.look.title}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Image with hotspots */}
        <div className="lg:col-span-8">
          <div className="relative aspect-4/5 overflow-hidden rounded-tile bg-sand sm:aspect-16/10">
            <Image
              key={board.look.id}
              src={board.look.image}
              alt={board.look.title}
              fill
              sizes="(min-width:1024px) 65vw, 100vw"
              className="object-cover"
            />

            {board.slots.map((slot) => {
              const id = `${board.look.id}-${slot.product.slug}`;
              const open = openSlot === id;
              return (
                <div
                  key={id}
                  className="absolute"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenSlot(open ? null : id)}
                    aria-label={`Shop ${slot.product.name}`}
                    aria-expanded={open}
                    className={cn(
                      "relative -ml-4 -mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-paper shadow-[0_2px_12px_rgba(0,0,0,0.18)] transition-transform duration-300",
                      open ? "scale-110" : "hover:scale-110",
                    )}
                  >
                    <Plus
                      size={14}
                      strokeWidth={2}
                      className={cn(
                        "transition-transform duration-300",
                        open && "rotate-45",
                      )}
                    />
                    {!open && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-paper/60" />
                    )}
                  </button>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                          "absolute z-10 w-[220px] rounded-card bg-paper p-3 shadow-[0_10px_40px_rgba(0,0,0,0.18)]",
                          slot.x > 60 ? "right-4" : "left-4",
                          slot.y > 55 ? "bottom-6" : "top-6",
                        )}
                      >
                        <Link
                          href={`/product/${slot.product.slug}`}
                          className="flex gap-3"
                        >
                          <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                            <Image
                              src={slot.product.thumbnail}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-medium">
                              {slot.product.name}
                            </p>
                            <p className="text-[12px] text-muted tabular-nums">
                              {formatPrice(slot.product.price)}
                            </p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => addToCart({ product: slot.product })}
                          className="mt-3 h-9 w-full rounded-full bg-brand text-[12px] font-medium text-paper transition-colors hover:bg-brand-hover"
                        >
                          Add to cart
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product list */}
        <div className="lg:col-span-4">
          <h3 className="display text-[1.35rem]">
            {board.look.title}
          </h3>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            {board.look.subtitle}
          </p>

          <ul className="mt-7 divide-y divide-line border-y border-line">
            {board.slots.map((slot) => (
              <li key={slot.product.id} className="flex items-center gap-3 py-3">
                <Link
                  href={`/product/${slot.product.slug}`}
                  className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg bg-sand"
                >
                  <Image
                    src={slot.product.thumbnail}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${slot.product.slug}`}
                    className="block truncate text-[12.5px] font-medium hover:text-muted"
                  >
                    {slot.product.name}
                  </Link>
                  <p className="text-[12px] text-muted tabular-nums">
                    {formatPrice(slot.product.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart({ product: slot.product })}
                  className="shrink-0 rounded-full bg-mint px-3.5 py-1.5 text-[11.5px] font-medium text-mint-ink transition-colors hover:bg-mint-deep"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
