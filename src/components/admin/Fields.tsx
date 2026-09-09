"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives for the dashboard.
 *
 * The storefront's fields are pill-shaped and airy, which suits a checkout but
 * wastes space in a dense admin form — these are square, tighter, and put the
 * error message under the control without reserving a permanent line.
 */

const control =
  "w-full rounded-[10px] border border-line bg-paper px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand disabled:bg-sand";

export function AdminField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-ink-soft">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal text-muted">(optional)</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11.5px] leading-relaxed text-muted">{hint}</p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-[11.5px] text-accent"
        >
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.ComponentPropsWithoutRef<"input"> & {
  id: string;
  error?: string;
};

export function AdminInput({ id, error, className, ...rest }: InputProps) {
  return (
    <input
      id={id}
      name={rest.name ?? id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(control, error && "border-accent", className)}
      {...rest}
    />
  );
}

export function AdminTextarea({
  id,
  error,
  className,
  rows = 4,
  ...rest
}: React.ComponentPropsWithoutRef<"textarea"> & {
  id: string;
  error?: string;
}) {
  return (
    <textarea
      id={id}
      name={rest.name ?? id}
      rows={rows}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(control, "resize-y leading-relaxed", error && "border-accent", className)}
      {...rest}
    />
  );
}

export function AdminSelect({
  id,
  error,
  className,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<"select"> & {
  id: string;
  error?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        name={rest.name ?? id}
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
        strokeWidth={1.7}
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

/** A checkbox that reads as a toggle chip — used for the merchandising flags. */
export function AdminCheckbox({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[10px] border px-3.5 py-3 transition-colors",
        checked
          ? "border-brand bg-brand-soft"
          : "border-line bg-paper hover:border-brand/40",
      )}
    >
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
      />
      <span>
        <span className="block text-[13px] font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

/** Groups a form into labelled cards so a long page stays scannable. */
export function AdminSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
