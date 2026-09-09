import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Primitives";
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

  return (
    <Container>
      <div className="py-10 md:py-14">
        <p className="eyebrow mb-4 text-muted">Order confirmed</p>
        <h1 className="display max-w-2xl text-[1.85rem] sm:text-[2.4rem]">
          Your order is on its way to being packed.
        </h1>
      </div>

      <OrderConfirmation number={number} />
    </Container>
  );
}
