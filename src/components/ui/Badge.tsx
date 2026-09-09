import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "new" | "sale" | "best" | "trending" | "neutral" | "soldout";

const tones: Record<Tone, string> = {
  new: "bg-brand text-paper",
  sale: "bg-accent text-paper",
  best: "bg-gold text-ink",
  trending: "bg-tint-lilac text-brand-deep",
  neutral: "bg-sand text-muted",
  soldout: "bg-paper text-muted border border-line",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full px-2.5 text-[10px] font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
