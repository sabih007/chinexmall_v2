"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { META_PIXEL_ID, consentRequired, pixelEnabled } from "@/lib/meta-pixel/config";
import { captureAttribution } from "@/lib/meta-pixel/attribution";
import {
  baseCode,
  consentState,
  grantMetaPixelConsent,
  revokeMetaPixelConsent,
  trackPageView,
} from "@/lib/meta-pixel/pixel";

/**
 * Meta Pixel base code, plus the PageView the App Router does not fire for you.
 *
 * Mounted once by the storefront shell, which is what keeps it off `/admin`:
 * the dashboard is staff traffic and has no business in an ad audience.
 *
 * - The initial PageView comes from the base code itself, as Meta ships it.
 * - Client-side navigations fire their own, because a soft navigation never
 *   reloads the script.
 * - Nothing renders and nothing loads until `NEXT_PUBLIC_META_PIXEL_ID` is
 *   set, so a local or preview deploy without the variable is untracked.
 */
export function MetaPixel() {
  const pathname = usePathname();
  /* The page the base code already reported, and every one reported since.
     Holding the pathname rather than a flag is what makes a re-run of this
     effect — development's strict mode runs each one twice — a no-op instead
     of a second PageView. */
  const reported = useRef<string | null>(null);

  /* Campaign parameters, captured before any navigation drops them from the
     URL, so an event reported from the checkout still knows which ad paid for
     the visit. */
  useEffect(() => {
    if (!pixelEnabled) return;
    captureAttribution();
  }, []);

  /* A consent banner, were one ever added, flips the pixel through here —
     no component needs to import anything. */
  useEffect(() => {
    if (!pixelEnabled || !consentRequired) return;
    window.chinexmallPixelConsent = {
      grant: grantMetaPixelConsent,
      revoke: revokeMetaPixelConsent,
      state: consentState,
    };
    return () => {
      delete window.chinexmallPixelConsent;
    };
  }, []);

  /* PageView on every client-side route change. Pathname only: the shop
     filters rewrite the query string as the shopper narrows a list, and each
     of those is the same page view, not a new one. */
  useEffect(() => {
    if (!pixelEnabled) return;
    if (reported.current === null) {
      /* The landing page. The base code's own PageView covered it. */
      reported.current = pathname;
      return;
    }
    if (reported.current === pathname) return;
    reported.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  if (!pixelEnabled) return null;

  return (
    <>
      <Script
        id="meta-pixel-base"
        strategy="afterInteractive"
        /* Meta's own snippet, with the pixel ID read from the environment.
           It installs the `fbq` queue before `fbevents.js` arrives, which is
           why it has to run as written rather than as imperative code. */
        dangerouslySetInnerHTML={{ __html: baseCode() }}
      />

      {/* Counts the visit for anyone with JavaScript switched off. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
