"use client";

import NextImage, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Retry the original asset if the deployment's image optimizer fails. */
export function StoreImage({ src, alt, onError, unoptimized, ...props }: ImageProps) {
  const source = typeof src === "string" ? src : src && ("src" in src ? src.src : src.default?.src);
  const [failure, setFailure] = useState({ source: "", stage: 0 });
  const stage = failure.source === source ? failure.stage : 0;
  if (!source || stage >= 2) {
    if (props["aria-hidden"]) return null;
    return <span role="img" aria-label={alt ? `${alt} — image unavailable` : "Image unavailable"} className={cn("flex items-center justify-center bg-sand p-3 text-center text-muted", props.fill ? "absolute inset-0" : "h-full w-full")}><span className="flex flex-col items-center gap-2"><ImageOff size={22} strokeWidth={1.4} /><span className="text-[11px]">Image unavailable</span></span></span>;
  }
  return <NextImage {...props} key={`${source}-${stage > 0 ? "original" : "optimized"}`} src={src} alt={alt} unoptimized={unoptimized || stage > 0} onError={(event) => {
    setFailure((previous) => ({ source, stage: previous.source === source ? Math.min(previous.stage + 1, 2) : 1 }));
    onError?.(event);
  }} />;
}
