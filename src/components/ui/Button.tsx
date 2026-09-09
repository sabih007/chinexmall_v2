import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "accent" | "gold" | "soft" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

/* Buttons are fully round and set in sentence case — the design leans friendly
   rather than editorial, so nothing here is letter-spaced or uppercased. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-40 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-paper hover:bg-brand-hover active:scale-[0.99] shadow-[0_6px_16px_-8px_rgba(91,69,163,0.7)]",
  secondary:
    "bg-paper text-ink border border-line hover:border-brand hover:text-brand active:scale-[0.99]",
  accent: "bg-accent text-paper hover:bg-accent-hover active:scale-[0.99]",
  gold: "bg-gold text-ink hover:bg-gold-hover active:scale-[0.99]",
  /* The quiet in-card action, e.g. "Select options" on a product card. */
  soft: "bg-mint text-mint-ink hover:bg-mint-deep active:scale-[0.99]",
  ghost: "bg-sand text-ink hover:bg-sand-deep",
  link: "text-brand underline-offset-4 hover:underline px-0",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[12px]",
  md: "h-11 px-6 text-[13px]",
  lg: "h-13 px-8 text-[14px]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
  children: ReactNode;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  full,
  className,
}: Omit<CommonProps, "children">) {
  return cn(
    base,
    variants[variant],
    variant === "link" ? "h-auto p-0" : sizes[size],
    full && "w-full",
    className,
  );
}

export function Button({
  variant,
  size,
  full,
  className,
  children,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={buttonClasses({ variant, size, full, className })}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  full,
  className,
  children,
  href,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      href={href}
      className={buttonClasses({ variant, size, full, className })}
      {...rest}
    >
      {children}
    </Link>
  );
}
