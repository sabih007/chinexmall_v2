"use client";

import { Check } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "Rs. 500" → "500" — the sign is rendered separately on variant pills. */
function bareAmount(value: number) {
  return formatPrice(value).slice(site.currency.prefix.length).trim();
}

/** Colour swatches, size/style/pack pills (spec §27). */
export function ProductVariants({
  product,
  selections,
  onChange,
}: {
  product: Product;
  selections: Record<string, string>;
  onChange: (optionId: string, value: string) => void;
}) {
  if (product.variants.length === 0) return null;

  return (
    <div className="space-y-6">
      {product.variants.map((option) => {
        const selected = option.values.find(
          (v) => v.value === selections[option.id],
        );

        return (
          <fieldset key={option.id}>
            <legend className="mb-3 flex w-full items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold">{option.name}</span>
              {selected && (
                <span className="text-[14px] text-muted">{selected.label}</span>
              )}
            </legend>

            {option.type === "color" ? (
              <div className="flex flex-wrap gap-2.5">
                {option.values.map((value) => {
                  const active = selections[option.id] === value.value;
                  return (
                    <button
                      key={value.value}
                      type="button"
                      disabled={value.available === false}
                      onClick={() => onChange(option.id, value.value)}
                      aria-label={value.label}
                      aria-pressed={active}
                      title={value.label}
                      className={cn(
                        "relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300",
                        active
                          ? "border-brand ring-2 ring-brand ring-offset-2 ring-offset-paper"
                          : "border-line hover:border-brand/50",
                        value.available === false &&
                          "cursor-not-allowed opacity-40",
                      )}
                    >
                      <span
                        className="h-7 w-7 rounded-full"
                        style={{ backgroundColor: value.hex ?? "#ddd" }}
                      />
                      {active && (
                        <Check
                          size={13}
                          strokeWidth={2.4}
                          className="absolute text-ink mix-blend-difference"
                          style={{ color: "#fff" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const active = selections[option.id] === value.value;
                  return (
                    <button
                      key={value.value}
                      type="button"
                      disabled={value.available === false}
                      onClick={() => onChange(option.id, value.value)}
                      aria-pressed={active}
                      className={cn(
                        "min-w-[3.25rem] rounded-full border px-4 py-2.5 text-[14px] transition-all duration-300",
                        active
                          ? "border-brand bg-brand text-paper"
                          : "border-line hover:border-brand hover:text-brand",
                        value.available === false &&
                          "cursor-not-allowed text-muted line-through opacity-50",
                      )}
                    >
                      {value.label}
                      {value.priceDelta ? (
                        <span
                          className={cn(
                            "ml-1.5 text-[13px]",
                            active ? "text-paper/60" : "text-muted",
                          )}
                        >
                          {value.priceDelta > 0 ? "+" : "−"}
                          {bareAmount(Math.abs(value.priceDelta))}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
