import Link from "next/link";
import { DeleteAccountForm, RefundForm } from "@/components/account-actions";
import { optionalUser } from "@/server/auth";
import { getStore } from "@/server/store";

export default async function AccountPage() {
  const user = await optionalUser();
  if (!user) {
    return (
      <main>
        <h1>Миний хэсэг</h1>
        <p>Эхлээд нүүр хуудаснаас нас, дараа нь нэвтрэлтээ оруулна уу.</p>
      </main>
    );
  }
  const store = getStore();
  const reports = await store.listReportsByOwner(user.id);
  const orders = (await store.listOrdersByOwner(user.id)).filter((order) => order.paymentStatus === "paid" || order.paymentStatus === "refund_requested");
  return (
    <main>
      <h1>Миний хэсэг</h1>
      <p>{user.email ?? "И-мэйл холбоогүй"}</p>
      <section className="stack-form">
        <h2>Тайлан</h2>
        {reports.length === 0 ? <p>Хадгалсан тайлан алга. Тест дуусгасны дараа энд гарна.</p> : null}
        <div className="catalog">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`} className="row">
              <span className={`swatch swatch-${swatchKind(report.kind)}`} aria-hidden="true" />
              <span className="row-title">{report.summary.title}</span>
            </Link>
          ))}
        </div>
      </section>
      <Link href="/account/photos" className="inline-link">
        Эх зураг устгах
      </Link>
      <section className="stack-form">
        <h2>Буцаалт</h2>
        <RefundForm orders={orders.map((order) => ({ id: order.id, label: `${order.amount}₮, ${order.productCode}` }))} />
      </section>
      <section>
        <h2>Бүртгэл устгах</h2>
        <DeleteAccountForm />
      </section>
    </main>
  );
}

function swatchKind(kind: string) {
  if (kind === "personality" || kind === "personality_report") return "personality";
  if (kind === "stress" || kind === "fun" || kind === "youth") return kind;
  return "style";
}
