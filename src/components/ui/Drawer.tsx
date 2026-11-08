"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Side = "right" | "left" | "bottom";

const panelVariants: Record<
  Side,
  { initial: Record<string, string>; animate: Record<string, string> }
> = {
  right: { initial: { x: "100%" }, animate: { x: "0%" } },
  left: { initial: { x: "-100%" }, animate: { x: "0%" } },
  bottom: { initial: { y: "100%" }, animate: { y: "0%" } },
};

const positions: Record<Side, string> = {
  right: "inset-y-0 right-0 h-full w-full max-w-[26rem] sm:rounded-l-tile",
  left: "inset-y-0 left-0 h-full w-full max-w-[22rem] sm:rounded-r-tile",
  bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-tile",
};

export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  headerSlot,
  footer,
  children,
  className,
  labelledBy = "drawer-title",
}: {
  open: boolean;
  onClose: () => void;
  side?: Side;
  title?: string;
  headerSlot?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* Focus the panel when it opens so keyboard users land inside it. */
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
          <motion.div
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === "Escape") { event.stopPropagation(); onClose(); return; }
              if (event.key !== "Tab") return;
              const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter((element) => element.getClientRects().length > 0);
              const first = targets[0];
              const last = targets[targets.length - 1];
              if (!first) { event.preventDefault(); return; }
              if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { event.preventDefault(); last.focus(); }
              else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) { event.preventDefault(); first.focus(); }
            }}
            className={cn(
              "absolute flex flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,0.12)] outline-none",
              positions[side],
              className,
            )}
            initial={panelVariants[side].initial}
            animate={panelVariants[side].animate}
            exit={panelVariants[side].initial}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
              {headerSlot ?? (
                <h2
                  id={labelledBy}
                  className="text-[16px] font-semibold"
                >
                  {title}
                </h2>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>

            {footer && (
              <div className="shrink-0 border-t border-line bg-paper">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
