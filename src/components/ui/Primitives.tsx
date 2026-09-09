import { Star } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page gutter. One place to change the site's max width and padding. */
export function Container({
  children,
  className,
  wide,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12",
        wide ? "max-w-[1600px]" : "max-w-[1440px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  tone = "paper",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "paper" | "sand" | "ink";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-10 md:py-14",
        tone === "sand" && "bg-sand",
        tone === "ink" && "bg-brand text-paper",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = "left",
  className,
  invert,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
  invert?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col gap-4 md:mb-9",
        align === "left"
          ? "md:flex-row md:items-end md:justify-between"
          : "items-center text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p
            className={cn(
              "eyebrow mb-2.5",
              invert ? "text-paper/60" : "text-brand",
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="display text-[1.4rem] sm:text-[1.65rem]">{title}</h2>
        {subtitle && (
          <p
            className={cn(
              "mt-2 text-[13.5px] leading-relaxed",
              invert ? "text-paper/70" : "text-muted",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Rating({
  value,
  count,
  size = 13,
  className,
  showValue,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}) {
  const rounded = Math.round(value);
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-[2px]"
        role="img"
        aria-label={`Rated ${value} out of 5`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={size}
            strokeWidth={1.5}
            className={
              i < rounded ? "fill-gold text-gold" : "fill-transparent text-line"
            }
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-medium tabular-nums">
          {value.toFixed(1)}
        </span>
      )}
      {count != null && (
        <span className="text-xs text-muted tabular-nums">({count})</span>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-4/5 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

/** Small label + value row used across product details and policy pages. */
export function SpecRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-line py-3 last:border-0">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}
