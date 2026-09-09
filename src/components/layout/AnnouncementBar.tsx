import { announcements } from "@/lib/site";

/**
 * Configurable announcement bar (spec §08). Multiple messages scroll as one
 * seamless marquee; edit `announcements` in src/lib/site.ts to change them.
 */
export function AnnouncementBar() {
  if (announcements.length === 0) return null;

  const track = [...announcements, ...announcements];

  return (
    <div className="relative z-50 overflow-hidden bg-brand text-paper">
      <div className="flex h-9 items-center">
        <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap will-change-transform">
          {track.map((message, i) => (
            <span
              key={`${message}-${i}`}
              className="flex items-center text-[12px] font-medium text-paper/90"
            >
              {message}
              <span aria-hidden className="px-6 text-paper/40">
                •
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
