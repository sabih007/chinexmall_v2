import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/RegisterForm";
import { Container } from "@/components/ui/Primitives";
import { safeNext } from "@/lib/account/form";
import { currentCustomer } from "@/lib/account/session";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  if (await currentCustomer()) redirect(destination);

  return (
    <Container>
      <div className="mx-auto max-w-[480px] py-12 md:py-20">
        <div className="mb-8 text-center">
          <h1 className="display text-[1.75rem]">Create your account</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            Save your delivery details once, then check out in a couple of taps.
          </p>
        </div>

        <div className="rounded-tile border border-line bg-paper p-6 shadow-card sm:p-8">
          <RegisterForm next={next ? destination : undefined} />
        </div>

        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-muted">
          Creating an account means you agree to our{" "}
          <Link href="/policies/terms" className="underline underline-offset-2 hover:text-ink">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/policies/privacy" className="underline underline-offset-2 hover:text-ink">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
