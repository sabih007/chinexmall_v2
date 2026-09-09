import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Container } from "@/components/ui/Primitives";
import { CartClient } from "./CartClient";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return (
    <Container>
      <div className="py-6">
        <Breadcrumbs items={[{ label: "Cart" }]} />
      </div>

      <div className="max-w-2xl pb-10">
        <h1 className="display text-[1.85rem] sm:text-[2.4rem]">
          Your cart
        </h1>
      </div>

      <CartClient />
    </Container>
  );
}
