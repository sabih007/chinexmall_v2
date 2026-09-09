import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Primitives";
import { currentCustomer } from "@/lib/account/session";
import { findOrderByNumber, toOrder } from "@/lib/order-store";
import { isOrderNumber } from "@/lib/orders";
import { OrderConfirmation } from "./OrderConfirmation";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  if (!isOrderNumber(number)) notFound();

  /**
   * Orders are stored, but an order number is short enough to guess, so one is
   * only rendered from the server for the account that placed it. Everyone
   * else — guests, and anyone typing in a number — gets the copy the browser
   * kept from its own checkout, exactly as before.
   */
  const account = await currentCustomer();
  const stored = account ? await findOrderByNumber(number) : null;
  const owned = stored && stored.customerId === account?.id ? stored : null;

  return (
    <Container>
      <div className="py-10 md:py-14">
        <p className="eyebrow mb-4 text-muted">Order confirmed</p>
        <h1 className="display max-w-2xl text-[1.85rem] sm:text-[2.4rem]">
          Your order is on its way to being packed.
        </h1>
      </div>

      <OrderConfirmation number={number} order={owned ? toOrder(owned) : null} />
    </Container>
  );
}
