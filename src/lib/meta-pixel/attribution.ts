/**
 * Campaign attribution, kept for the life of the tab.
 *
 * Client-side routing means the UTM parameters a shopper arrived on are gone
 * from the URL by the time they reach the checkout, so the landing query is
 * captured once and read back when an event is reported. Nothing here rewrites
 * a URL or touches a link: the parameters are preserved by remembering them,
 * not by dragging them through every navigation.
 */

const STORE_KEY = "cx.meta.attribution.v1";

/** Query keys worth keeping. `fbclid` is what the pixel turns into `_fbc`. */
const TRACKED = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "ttclid",
  "msclkid",
] as const;

export interface Attribution {
  /** First-touch campaign parameters for this tab. */
  params: Record<string, string>;
  /** The URL the shopper landed on, UTMs intact. */
  landingUrl?: string;
  /** When the tab started, ISO 8601. */
  firstSeen?: string;
}

const empty: Attribution = { params: {} };

function read(): Attribution {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Attribution;
    return parsed && typeof parsed === "object" && parsed.params
      ? parsed
      : empty;
  } catch {
    /* private mode or corrupt value — attribute from cookies alone */
    return empty;
  }
}

/**
 * Records the campaign parameters of the current URL, once per tab.
 *
 * First touch wins: a shopper who arrives from an ad and later follows an
 * email link still counts as the ad's, which is how Meta attributes it too.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return empty;

  const existing = read();
  if (Object.keys(existing.params).length > 0) return existing;

  const query = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  for (const key of TRACKED) {
    const value = query.get(key);
    if (value) params[key] = value.slice(0, 200);
  }

  const next: Attribution = {
    params,
    landingUrl: window.location.href,
    firstSeen: new Date().toISOString(),
  };

  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    /* nothing to persist into — the in-memory return value still serves */
  }
  return next;
}

export function attribution(): Attribution {
  return typeof window === "undefined" ? empty : read();
}

/** One cookie, by name, or undefined. */
function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * The two first-party cookies the pixel sets. Handing them to the Conversions
 * API is what lets Meta recognise a server event as the same person as the
 * browser one.
 */
export function browserIdentifiers(): { fbp?: string; fbc?: string } {
  const fbp = cookie("_fbp");
  const fbc = cookie("_fbc");
  return { ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) };
}
