import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  SESSION_TTL_MS,
  createSessionToken,
  isValidSessionToken,
} from "./auth";

/**
 * Cookie side of the admin session.
 *
 * `proxy.ts` keeps signed-out visitors off `/admin`, but that is only an
 * optimistic check: every page and every Server Action calls `requireAdmin()`
 * as well, because Server Actions are reachable by direct POST.
 */

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Redirects to the login page when the caller is not signed in. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function startAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
