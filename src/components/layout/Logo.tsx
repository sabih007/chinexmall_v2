import Image from "next/image";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/* Intrinsic dimensions of the artwork in `public/`. Passing them keeps the
   header from shifting while the image loads; the rendered size comes from the
   `h-*` utility on top, with the width left to follow the ratio. */
const WORDMARK = { width: 1428, height: 275 };
const MARK = { width: 338, height: 275 };

export type LogoVariant = "colour" | "white" | "mark";

const sources: Record<LogoVariant, { src: string } & typeof WORDMARK> = {
  colour: { src: "/logo.png", ...WORDMARK },
  /* Knocked-out version, for the navy footer and any other dark ground. */
  white: { src: "/logo-white.png", ...WORDMARK },
  /* Cart glyph on its own, where a full wordmark would be too wide. */
  mark: { src: "/logo-mark.png", ...MARK },
};

/**
 * The ChineXmall logo. `className` carries the height (`h-8 w-auto`); the
 * component only decides which artwork and how it is announced.
 */
export function Logo({
  variant = "colour",
  className,
  priority,
}: {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const { src, width, height } = sources[variant];
  return (
    <Image
      src={src}
      alt={site.name}
      width={width}
      height={height}
      priority={priority}
      sizes="240px"
      className={cn("w-auto select-none object-contain", className)}
    />
  );
}
