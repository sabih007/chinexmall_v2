import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/layout/Logo";
import { isAdminConfigured } from "@/lib/admin/auth";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const configured = isAdminConfigured();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-sand px-5 py-16">
      <div className="w-full max-w-[380px]">
        <div className="mb-7 text-center">
          <Link href="/" className="inline-block" aria-label={`${site.name} home`}>
            <Logo className="mx-auto h-8" priority />
          </Link>
          <p className="mt-2 text-[13px] text-muted">Store dashboard</p>
        </div>

        <div className="rounded-tile border border-line bg-paper p-6 shadow-card">
          {configured ? (
            <LoginForm next={next} />
          ) : (
            <div className="text-[13px] leading-relaxed text-ink-soft">
              <p className="font-medium text-ink">The dashboard is not set up yet.</p>
              <p className="mt-2 text-muted">
                Add a password to <code className="rounded bg-sand px-1.5 py-0.5 text-[12px]">.env.local</code> in
                the project root, then restart the dev server:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-[10px] bg-ink px-3.5 py-3 text-[12px] leading-relaxed text-paper">
                ADMIN_PASSWORD=choose-something-long
              </pre>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-[12px] text-muted">
          <Link href="/" className="hover:text-ink">
            ← Back to the store
          </Link>
        </p>
      </div>
    </div>
  );
}
