import Link from "next/link";
import { DeleteAccountForm, RefundForm } from "@/components/account-actions";
import { optionalUser } from "@/server/auth";
import { getStore } from "@/server/store";

export default async function AccountPage() {
  const user = await optionalUser();
  if (!user) {
    return (
      <main>
        <h1 className="text-2xl font-semibold">Миний хэсэг</h1>
        <p>Эхлээд нүүр хуудаснаас нас, дараа нь нэвтрэлтээ оруулна уу.</p>
      </main>
    );
  }
  const store = getStore();
  const reports = await store.listReportsByOwner(user.id);
  const orders = (await store.listOrdersByOwner(user.id)).filter((order) => order.paymentStatus === "paid" || order.paymentStatus === "refund_requested");
  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">Миний хэсэг</h1>
      <p>{user.email ?? "И-мэйл холбоогүй"}</p>
      <section className="grid gap-2">
        <h2 className="font-medium">Тайлан</h2>
        {reports.length === 0 ? <p>Хадгалсан тайлан алга.</p> : null}
        {reports.map((report) => (
          <Link key={report.id} href={`/reports/${report.id}`} className="rounded-xl border border-stone-200 bg-white p-3">
            {report.summary.title}
          </Link>
        ))}
      </section>
      <Link href="/account/photos" className="underline">
        Эх зураг устгах
      </Link>
      <section className="grid gap-2">
        <h2 className="font-medium">Буцаалт</h2>
        <RefundForm orders={orders.map((order) => ({ id: order.id, label: `${order.amount}₮ · ${order.productCode}` }))} />
      </section>
      <section>
        <h2 className="mb-2 font-medium">Бүртгэл устгах</h2>
        <DeleteAccountForm />
      </section>
    </main>
  );
}
