"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export function Accordion({
  items,
  defaultOpen,
  className,
}: {
  items: AccordionItem[];
  /** Id of the row that starts expanded. */
  defaultOpen?: string;
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              aria-controls={`acc-${item.id}`}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-[15px] font-semibold">{item.title}</span>
              <Plus
                size={16}
                strokeWidth={1.5}
                className={cn(
                  "shrink-0 text-muted transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  open && "rotate-45 text-brand",
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={`acc-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 text-[15px] leading-relaxed text-muted">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
