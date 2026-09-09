"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Container, Section } from "@/components/ui/Primitives";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "done" | "error";

/**
 * Newsletter capture (spec §38). Posts to /api/newsletter, which is the seam
 * to wire up Klaviyo / Mailchimp / Supabase later.
 */
export function NewsletterForm({
  compact,
  invert,
}: {
  /** Footer sizing: one line, no supporting copy above it. */
  compact?: boolean;
  /** Sitting on the navy footer rather than a light section. */
  invert?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
      setMessage(data.message ?? "You're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  const fieldId = compact ? "newsletter-footer" : "newsletter-main";

  if (status === "done") {
    return (
      <p
        className={cn(
          "flex items-center gap-2 text-[13px]",
          invert ? "text-paper/85" : "text-mint-ink",
        )}
      >
        <Check size={15} strokeWidth={2} />
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* A single rounded pill with the action tucked inside it. */}
      <div className="relative">
        <label htmlFor={fieldId} className="sr-only">
          Email address
        </label>
        <input
          id={fieldId}
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Enter your email"
          autoComplete="email"
          className={cn(
            "h-12 w-full rounded-full pl-5 pr-[124px] text-[13.5px] outline-none transition-colors",
            invert
              ? "border border-paper/25 bg-paper/10 text-paper placeholder:text-paper/55 focus:border-paper/60"
              : "border border-line bg-paper placeholder:text-muted focus:border-brand",
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            "group absolute right-1 top-1 flex h-10 items-center gap-2 rounded-full px-5 text-[13px] font-medium transition-colors disabled:opacity-50",
            invert
              ? "bg-gold text-ink hover:bg-gold-hover"
              : "bg-brand text-paper hover:bg-brand-hover",
          )}
        >
          {status === "loading" ? "Joining" : "Join"}
          <ArrowRight
            size={14}
            strokeWidth={1.9}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>
      </div>

      {status === "error" && (
        <p
          role="alert"
          className={cn(
            "mt-2 text-[12px]",
            invert ? "text-gold" : "text-accent",
          )}
        >
          {message}
        </p>
      )}

      <p
        className={cn(
          "mt-3 text-[11.5px]",
          invert ? "text-paper/55" : "text-muted",
        )}
      >
        No spam. Unsubscribe any time.
      </p>
    </form>
  );
}

export function Newsletter() {
  return (
    <Section>
      <Container>
        <div className="grid items-center gap-10 rounded-tile bg-tint-lilac px-6 py-12 sm:px-12 lg:grid-cols-2 lg:gap-20 lg:px-16">
          <div>
            <p className="eyebrow text-brand">Newsletter</p>
            <h2 className="display mt-4 text-[2rem] sm:text-[2.4rem]">
              Get first dibs.
            </h2>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-soft/80">
              New arrivals, trending finds and special offers — straight to your
              inbox, about twice a month.
            </p>
          </div>

          <div className="lg:pl-10">
            <NewsletterForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}
