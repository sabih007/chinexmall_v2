import type { Metadata } from "next";
import { Heart, LogOut, Package, Store } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/(storefront)/account/actions";
import { OrderHistory } from "@/components/account/OrderHistory";
import { PasswordForm } from "@/components/account/PasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Container } from "@/components/ui/Primitives";
import { requireCustomer } from "@/lib/account/session";
import { listOrdersForCustomer, toOrder } from "@/lib/order-store";
import { formatPhone } from "@/lib/orders";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const account = await requireCustomer("/account");
  const orders = (await listOrdersForCustomer(account.id)).map(toOrder);
  const joined = new Date(account.createdAt).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Container>
      <div className="py-6">
        <Breadcrumbs items={[{ label: "Account" }]} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
        <div>
          <h1 className="display text-[1.85rem] sm:text-[2.2rem]">
            Hello, {account.firstName}
          </h1>
          <p className="mt-2 text-[13.5px] text-muted">
            {account.email}
            {account.phone && ` · ${formatPhone(account.phone)}`}
          </p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand"
          >
            <LogOut size={14} strokeWidth={1.8} />
            Sign out
          </button>
        </form>
      </div>

      <div className="grid gap-6 pb-16 lg:grid-cols-12 lg:pb-24">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <section className="rounded-tile border border-line bg-paper p-6 shadow-card sm:p-8">
            <h2 className="text-[15px] font-semibold">Your details</h2>
            <p className="mb-6 mt-1 text-[12.5px] text-muted">
              Saved here, filled in for you at checkout.
            </p>
            <ProfileForm account={account} />
          </section>

          <section className="rounded-tile border border-line bg-paper p-6 shadow-card sm:p-8">
            <h2 className="text-[15px] font-semibold">Password</h2>
            <p className="mb-6 mt-1 text-[12.5px] text-muted">
              Choose something you do not use anywhere else.
            </p>
            <PasswordForm />
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <section className="rounded-tile border border-line bg-paper p-6 shadow-card sm:p-8">
            <h2 className="flex items-center gap-2.5 text-[15px] font-semibold">
              <Package size={16} strokeWidth={1.7} className="text-brand" />
              Your orders
            </h2>
            <p className="mb-5 mt-1 text-[12.5px] text-muted">
              {orders.length > 0
                ? "Tap an order to see what was in it."
                : "Anything you order while signed in is filed here."}
            </p>

            <OrderHistory orders={orders} />

            <Link
              href="/contact"
              className="mt-5 inline-block border-t border-line pt-5 text-[12.5px] font-medium text-brand underline-offset-4 hover:underline"
            >
              Ask about an order
            </Link>
          </section>

          <section className="rounded-tile border border-line p-6 sm:p-8">
            <h2 className="text-[15px] font-semibold">Shortcuts</h2>
            <ul className="mt-4 flex flex-col gap-1">
              <li>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 rounded-card px-3 py-2.5 text-[13px] text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand"
                >
                  <Heart size={15} strokeWidth={1.7} />
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="flex items-center gap-3 rounded-card px-3 py-2.5 text-[13px] text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand"
                >
                  <Store size={15} strokeWidth={1.7} />
                  Continue shopping
                </Link>
              </li>
            </ul>

            <p className="mt-6 border-t border-line pt-5 text-[11.5px] text-muted">
              Member of {site.shortName} since {joined}.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
