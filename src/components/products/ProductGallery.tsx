"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BLUR_DATA_URL } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Product gallery (spec §26, §41): swipeable on mobile with dot indicators,
 * thumbnail rail plus arrows on desktop. Driven from outside so a variant
 * change can move the gallery.
 */
export function ProductGallery({
  images,
  alt,
  activeIndex,
  onActiveIndexChange,
}: {
  images: string[];
  alt: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setUserScrolling] = useState(false);

  /* Keep the mobile scroller in sync when the index changes externally. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || isUserScrolling) return;
    track.scrollTo({ left: activeIndex * track.clientWidth, behavior: "smooth" });
  }, [activeIndex, isUserScrolling]);

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setUserScrolling(true);
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeIndex) onActiveIndexChange(index);
    window.clearTimeout((onScroll as unknown as { t?: number }).t);
    (onScroll as unknown as { t?: number }).t = window.setTimeout(
      () => setUserScrolling(false),
      160,
    );
  }

  const step = (delta: number) =>
    onActiveIndexChange((activeIndex + delta + images.length) % images.length);

  return (
    <div className="lg:flex lg:gap-4">
      {/* Desktop thumbnails */}
      {images.length > 1 && (
        <div className="hidden shrink-0 flex-col gap-3 lg:flex">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => onActiveIndexChange(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
              className={cn(
                "relative aspect-square w-[72px] overflow-hidden rounded-card bg-sand transition-opacity",
                i === activeIndex
                  ? "opacity-100 ring-1 ring-ink"
                  : "opacity-60 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative min-w-0 flex-1">
        {/* Mobile: native scroll-snap carousel */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:hidden"
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="relative aspect-square w-full shrink-0 snap-center rounded-tile bg-sand"
            >
              <Image
                src={src}
                alt={i === 0 ? alt : ""}
                fill
                priority={i === 0}
                sizes="100vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Desktop: single image with arrows */}
        <div className="group/gallery relative hidden aspect-square w-full overflow-hidden rounded-tile bg-sand lg:block">
          {images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={i === activeIndex ? alt : ""}
              fill
              priority={i === 0}
              sizes="(min-width:1024px) 45vw, 100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className={cn(
                "object-cover transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                i === activeIndex ? "opacity-100" : "opacity-0",
              )}
            />
          ))}

          {images.length > 1 && (
            <>
              <GalleryArrow side="left" onClick={() => step(-1)} />
              <GalleryArrow side="right" onClick={() => step(1)} />
            </>
          )}
        </div>

        {/* Mobile dots */}
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5 lg:hidden">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => onActiveIndexChange(i)}
                aria-label={`Go to image ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === activeIndex ? "w-5 bg-ink" : "w-1.5 bg-line",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:bg-paper focus-visible:opacity-100 group-hover/gallery:opacity-100",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon size={18} strokeWidth={1.5} />
    </button>
  );
}
