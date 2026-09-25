import { notFound } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout-panel";
import { optionalUser } from "@/server/auth";
import { ensurePayLinks, publicOrder } from "@/server/order-service";
import { getStore } from "@/server/store";

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await optionalUser();
  if (!user) notFound();
  const order = await getStore().getOrder(orderId);
  if (!order || order.ownerUid !== user.id) notFound();
  const ready = await ensurePayLinks(order);
  return (
    <main className="grid gap-4">
      <h1>Төлбөр</h1>
      <CheckoutPanel initial={publicOrder(ready)} />
    </main>
  );
}
