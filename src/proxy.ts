import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/admin/auth";

/**
 * Keeps signed-out visitors off the dashboard, and signed-in operators off the
 * login page.
 *
 * This is an optimistic check only — the Next.js docs are explicit that Proxy
 * is not a session-management layer. The real check lives in `requireAdmin()`,
 * which every admin page and every Server Action calls.
 *
 * (Middleware is called Proxy from Next.js 16 onwards; the file must sit beside
 * `app`, hence `src/proxy.ts`.)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = await isValidSessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );

  if (pathname === "/admin/login") {
    if (!signedIn) return NextResponse.next();
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (signedIn) return NextResponse.next();

  const login = new URL("/admin/login", request.url);
  // Come back to whatever the operator was reaching for after signing in.
  if (pathname !== "/admin") login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
