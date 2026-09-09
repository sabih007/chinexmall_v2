import type { ReactNode } from "react";
import { StorefrontShell } from "@/components/layout/StorefrontShell";

/**
 * Route group for every shopper-facing page. The group adds no URL segment —
 * `/shop` is still `/shop` — it only scopes the storefront chrome so that
 * `/admin` can sit outside it.
 */
export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
