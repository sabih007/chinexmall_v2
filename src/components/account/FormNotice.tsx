import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one banner the account forms use for what an action came back with —
 * a rejection or a confirmation. It always renders as an alert, so a shopper
 * using a screen reader hears the result without hunting for it.
 */
export function FormNotice({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: ReactNode;
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-card px-4 py-3 text-[12.5px] leading-relaxed",
        tone === "success"
          ? "bg-mint text-mint-ink"
          : "border border-accent/25 bg-accent-soft text-accent",
      )}
    >
      <Icon size={15} strokeWidth={1.8} className="mt-px shrink-0" />
      {children}
    </p>
  );
}
