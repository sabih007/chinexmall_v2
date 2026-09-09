import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Container } from "@/components/ui/Primitives";
import { getProducts } from "@/lib/repository";
import { WishlistClient } from "./WishlistClient";

export const metadata: Metadata = {
  title: "Your wishlist",
  description: "The products you have saved for later.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/wishlist" },
};

export default async function WishlistPage() {
  // The wishlist is client-side, so ship the catalogue and resolve on hydration.
  const { items } = await getProducts({});

  return (
    <Container>
      <div className="py-6">
        <Breadcrumbs items={[{ label: "Wishlist" }]} />
      </div>

      <div className="max-w-2xl pb-10">
        <h1 className="display text-[1.85rem] sm:text-[2.4rem]">
          Your wishlist
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Saved on this device. Move something to the cart whenever you are
          ready.
        </p>
      </div>

      <div className="pb-24">
        <WishlistClient products={items} />
      </div>
    </Container>
  );
}
