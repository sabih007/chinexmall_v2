"use client";

import Script from "next/script";

/**
 * Google Tag Manager container.
 *
 * Mounted once by the storefront shell, for the same reason the Meta Pixel is:
 * `/admin` is staff traffic and has no business in an analytics property or a
 * remarketing audience.
 *
 * Nothing renders and nothing loads until `NEXT_PUBLIC_GTM_ID` is set, so a
 * local run or a preview deploy without the variable is untracked.
 *
 * Route changes are not reported from here. GTM's own **History Change**
 * trigger fires on the `pushState` that App Router navigation performs, so
 * configure the page-view tag against that trigger inside the container —
 * pushing our own event as well would double-count every soft navigation.
 */

/**
 * Container ID, narrowed to the characters a real one can contain.
 *
 * It is interpolated into an inline script, so a fat-fingered environment
 * variable must not be able to become script. Same reasoning as the pixel ID
 * being reduced to digits.
 */
const GTM_ID = (process.env.NEXT_PUBLIC_GTM_ID ?? "")
  .toUpperCase()
  .replace(/[^A-Z0-9-]/g, "");

/** Nothing loads and nothing is tracked until the container is configured. */
export const gtmEnabled = /^GTM-[A-Z0-9]+$/.test(GTM_ID);

/**
 * Google's own container snippet, with the `gtag` shim kept alongside it.
 *
 * One inline block rather than an init script plus an `async` tag, because
 * `dataLayer` and the `gtm.start` timing mark have to exist *before* gtm.js
 * evaluates, and `next/script` makes no ordering promise between two separate
 * `afterInteractive` scripts.
 */
function containerSnippet(): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
(function(d,s,i){
  var f=d.getElementsByTagName(s)[0], j=d.createElement(s);
  j.async=true;
  j.src='https://www.googletagmanager.com/gtm.js?id='+i;
  f.parentNode.insertBefore(j,f);
})(document,'script','${GTM_ID}');
`.trim();
}

export function GoogleTagManager() {
  if (!gtmEnabled) return null;

  return (
    <>
      <Script
        id="gtm-container"
        strategy="afterInteractive"
        /* Google's snippet has to run as written — it installs `dataLayer`
           and the timing mark ahead of the container it then injects. */
        dangerouslySetInnerHTML={{ __html: containerSnippet() }}
      />

      {/* Counts the visit for anyone with JavaScript switched off. */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
