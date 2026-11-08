"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Form primitives for the checkout. Deliberately plain: a border, a label that
   never moves, and an error message that reserves its own line so the layout
   does not jump when validation runs. */

const control =
  "h-12 w-full rounded-full border border-line bg-paper px-4.5 text-[16px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand";

export function Field({
  label,
  htmlFor,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[14px] font-medium text-ink-soft"
      >
        {label}
        {optional && <span className="ml-1.5 normal-case tracking-normal opacity-70">(optional)</span>}
      </label>
      {children}
      <p
        id={`${htmlFor}-error`}
        role={error ? "alert" : undefined}
        className={cn(
          "min-h-4 text-[13px] text-accent",
          !error && "invisible",
        )}
      >
        {error ?? "\u00a0"}
      </p>
    </div>
  );
}

export function TextInput({
  id,
  error,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"input"> & { id: string; error?: string }) {
  return (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(control, error && "border-accent", className)}
      {...rest}
    />
  );
}

export function Select({
  id,
  error,
  className,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<"select"> & { id: string; error?: string }) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          control,
          "appearance-none pr-10",
          error && "border-accent",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        strokeWidth={1.6}
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export function TextArea({
  id,
  error,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"textarea"> & { id: string; error?: string }) {
  return (
    <textarea
      id={id}
      rows={3}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(
        control,
        "h-auto resize-none py-3 leading-relaxed",
        error && "border-accent",
        className,
      )}
      {...rest}
    />
  );
}

/** Radio presented as a full-width selectable card (delivery / payment). */
export function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  trailing,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description: string;
  trailing?: ReactNode;
  /** Revealed only while this option is selected. */
  children?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "block cursor-pointer rounded-card border p-4 transition-colors sm:p-5",
        /* The radio itself is visually hidden, so the card carries the focus ring. */
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
        checked ? "border-brand bg-brand-soft/60" : "border-line hover:border-brand/40",
      )}
    >
      <div className="flex items-start gap-3.5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            checked ? "border-brand" : "border-line",
          )}
        >
          {checked && <span className="h-2 w-2 rounded-full bg-brand" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-medium">{title}</span>
            {trailing && (
              <span className="shrink-0 text-[15px] font-medium tabular-nums">
                {trailing}
              </span>
            )}
          </span>
          <span className="mt-1 block text-[14px] leading-relaxed text-muted">
            {description}
          </span>
          {checked && children}
        </span>
      </div>
    </label>
  );
}

/** Numbered section heading, so the form reads as a sequence of steps. */
export function Step({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 className="mb-5 flex items-center gap-3 text-[16px] font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[13px] text-paper tabular-nums">
          {index}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
