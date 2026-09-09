import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { currentCustomer } from "@/lib/account/session";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default async function CheckoutPage() {
  /* A signed-in shopper's saved details seed the form; a guest checks out
     exactly as before, with nothing standing between them and the order. */
  const account = await currentCustomer();

  return (
    <Container>
      <div className="flex flex-wrap items-baseline justify-between gap-4 py-10 md:py-14">
        <h1 className="display text-[1.85rem] sm:text-[2.4rem]">
          Checkout
        </h1>
        <Link
          href="/cart"
          className="rounded-full border border-line px-4 py-2 text-[12.5px] font-medium text-muted transition-colors hover:border-brand hover:text-brand"
        >
          Back to cart
        </Link>
      </div>

      {!account && (
        <p className="mb-8 rounded-card bg-sand px-5 py-4 text-[13px] text-ink-soft">
          Have an account?{" "}
          <Link
            href="/account/login?next=%2Fcheckout"
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Sign in
          </Link>{" "}
          to fill this in from your saved details — or carry on as a guest.
        </p>
      )}

      <CheckoutClient
        account={
          account && {
            firstName: account.firstName,
            lastName: account.lastName,
            email: account.email,
            phone: account.phone,
            address: account.address,
          }
        }
      />
    </Container>
  );
}
