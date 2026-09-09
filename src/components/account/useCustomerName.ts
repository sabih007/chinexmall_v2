"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { CUSTOMER_NAME_COOKIE } from "@/lib/account/auth";

/**
 * The signed-in shopper's first name, or null.
 *
 * Read from the readable companion cookie rather than fetched, so the header
 * costs nothing on a page that would otherwise be static. It is a greeting and
 * nothing more: every page and action that matters resolves the real session
 * on the server.
 *
 * The cookie is an external store, so it is read as one — null on the server
 * and through hydration, then the real value, re-read on every navigation,
 * which is when signing in or out lands.
 */
export function useCustomerName(): string | null {
  usePathname();
  return useSyncExternalStore(subscribe, readNameCookie, serverSnapshot);
}

/** Nothing to subscribe to: a cookie fires no events, and a navigation
 *  re-renders this hook's caller anyway. */
function subscribe(): () => void {
  return () => {};
}

function serverSnapshot(): null {
  return null;
}

function readNameCookie(): string | null {
  if (typeof document === "undefined") return null;

  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key !== CUSTOMER_NAME_COOKIE) continue;
    try {
      return decodeURIComponent(rest.join("=")) || null;
    } catch {
      return null;
    }
  }
  return null;
}
