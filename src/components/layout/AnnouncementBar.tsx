import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

/** A quiet, readable offer instead of a continuously moving message. */
export function AnnouncementBar() {
  return (
    <div className="bg-brand-deep px-4 py-2 text-center text-[13px] leading-relaxed text-paper sm:text-xs">
      Cash on delivery available <span aria-hidden className="px-2 text-white/40">·</span>
      <Link href="/policies/shipping" className="underline underline-offset-4 hover:text-gold">Free standard delivery over {formatPrice(site.freeShippingThreshold)}</Link>
    </div>
  );
}
