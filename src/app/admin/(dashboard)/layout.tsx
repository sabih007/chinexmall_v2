import type { Metadata } from "next";
import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/layout/Logo";
import { requireAdmin } from "@/lib/admin/session";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: `%s · ${site.name} dashboard` },
  robots: { index: false, follow: false },
};

/**
 * Chrome for every signed-in dashboard page.
 *
 * `requireAdmin()` runs here as well as in each Server Action: `proxy.ts` has
 * already redirected signed-out visitors, but a layout guard is what makes the
 * rendered data safe if the proxy matcher is ever loosened.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-sand">
      <aside className="border-b border-line bg-paper lg:fixed lg:inset-y-0 lg:left-0 lg:w-[248px] lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-4 px-5 py-4 lg:flex-col lg:items-stretch lg:gap-6 lg:px-4 lg:py-6">
          <Link href="/admin" className="shrink-0" aria-label={`${site.name} dashboard`}>
            <Logo className="h-7" priority />
          </Link>

          <div className="flex-1 overflow-x-auto no-scrollbar lg:flex-none lg:overflow-visible">
            <AdminNav />
          </div>

          <div className="hidden lg:mt-auto lg:block">
            <AdminFooterLinks />
          </div>

          <div className="lg:hidden">
            <SignOutButton compact />
          </div>
        </div>
      </aside>

      <main className="px-5 py-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[900px]">{children}</div>
      </main>
    </div>
  );
}

function AdminFooterLinks() {
  return (
    <div className="flex flex-col gap-1 border-t border-line pt-4">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:bg-sand"
      >
        <ExternalLink size={16} strokeWidth={1.7} />
        View store
      </Link>
      <SignOutButton />
    </div>
  );
}

function SignOutButton({ compact }: { compact?: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          compact
            ? "flex items-center gap-2 rounded-full px-3 py-2 text-[13px] text-muted transition-colors hover:text-ink"
            : "flex w-full items-center gap-2.5 rounded-[10px] px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:bg-sand"
        }
      >
        <LogOut size={16} strokeWidth={1.7} />
        {compact ? "" : "Sign out"}
        {compact && <span className="sr-only">Sign out</span>}
      </button>
    </form>
  );
}
