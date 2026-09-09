import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default function CheckoutPage() {
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

      <CheckoutClient />
    </Container>
  );
}
