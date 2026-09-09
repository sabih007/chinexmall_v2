import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/account/SignInForm";
import { Container } from "@/components/ui/Primitives";
import { safeNext } from "@/lib/account/form";
import { currentCustomer } from "@/lib/account/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  /* Already signed in — go where they were headed rather than asking again. */
  if (await currentCustomer()) redirect(destination);

  return (
    <Container>
      <div className="mx-auto max-w-[420px] py-12 md:py-20">
        <div className="mb-8 text-center">
          <h1 className="display text-[1.75rem]">Welcome back</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            Sign in to check out faster and keep your details in one place.
          </p>
        </div>

        <div className="rounded-tile border border-line bg-paper p-6 shadow-card sm:p-8">
          <SignInForm next={next ? destination : undefined} />
        </div>
      </div>
    </Container>
  );
}
