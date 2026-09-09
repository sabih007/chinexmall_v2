import { PackageCheck, RefreshCw, Ship, Tag } from "lucide-react";
import type { ComponentType } from "react";
import { Reveal } from "@/components/common/Reveal";
import { Container, Section } from "@/components/ui/Primitives";
import { valueProps } from "@/lib/site";
import { cn } from "@/lib/utils";

const icons: Record<string, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  sparkles: PackageCheck,
  ship: Ship,
  tag: Tag,
  refresh: RefreshCw,
};

/* Each benefit gets its own pastel icon bubble, cycled so no two touch. */
const TINTS = [
  "bg-tint-lilac text-brand",
  "bg-tint-lemon text-ink",
  "bg-tint-green text-mint-ink",
  "bg-tint-peach text-accent",
];

/** Four short benefits (spec §22), as a row of soft cards. */
export function WhyShop() {
  return (
    <Section>
      <Container>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop, i) => {
            const Icon = icons[prop.icon] ?? PackageCheck;
            return (
              <Reveal as="li" key={prop.title} delay={i * 0.06}>
                <div className="flex h-full items-start gap-4 rounded-card border border-line bg-paper p-5">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      TINTS[i % TINTS.length],
                    )}
                  >
                    <Icon size={19} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-semibold">{prop.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                      {prop.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
