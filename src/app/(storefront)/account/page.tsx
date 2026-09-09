import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

/**
 * Placeholder account page. Accounts arrive with the backend — wire this to
 * Supabase Auth, Shopify customer accounts or your own session layer.
 */
export default function AccountPage() {
  return (
    <Container>
      <div className="py-6">
        <Breadcrumbs items={[{ label: "Account" }]} />
      </div>

      <div className="mx-auto max-w-md rounded-card border border-line px-8 py-16 text-center">
        <h1 className="display text-[1.75rem] leading-tight">Accounts</h1>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          Customer accounts and order history arrive with the backend
          integration. For now, your cart and wishlist are saved on this device,
          and orders can be placed by checkout or WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/wishlist" variant="secondary">
            View wishlist
          </ButtonLink>
          <ButtonLink href="/shop">Continue shopping</ButtonLink>
        </div>
      </div>
    </Container>
  );
}
