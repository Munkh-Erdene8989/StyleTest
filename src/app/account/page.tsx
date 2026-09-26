import Link from "next/link";
import { DeleteAccountForm, RefundForm } from "@/components/account-actions";
import { StatusBar } from "@/components/status-bar";
import { formatDay } from "@/lib/format";
import { optionalUser } from "@/server/auth";
import { listAccountTracks } from "@/server/result-service";
import { getStore } from "@/server/store";

export default async function AccountPage() {
  const user = await optionalUser();
  if (!user) {
    return (
      <main>
        <h1>Миний хэсэг</h1>
        <p>Тест эхлүүлэхэд төрсөн өдөр нэг удаа бүртгэгдэнэ. Нэвтэрсний дараа энд харагдана.</p>
        <Link className="btn" href="/#tests">
          Тест эхлүүлэх
        </Link>
      </main>
    );
  }
  const store = getStore();
  const tracks = await listAccountTracks(user);
  const orders = (await store.listOrdersByOwner(user.id)).filter((order) => order.paymentStatus === "paid" || order.paymentStatus === "refund_requested");
  return (
    <main>
      <h1>Миний хэсэг</h1>
      <p>{user.email ?? "И-мэйл холбоогүй"}</p>
      <p>Төрсөн өдөр: {user.dateOfBirth ? formatDay(`${user.dateOfBirth}T00:00:00Z`) : "Ороогүй"}</p>
      <p>Нас: {ageLabel(user.ageBand)}</p>
      <section className="stack-form">
        <h2>Тайлан</h2>
        {tracks.length === 0 ? (
          <>
            <p>Хадгалсан тайлан алга. Тест эхлүүлбэл явц энд гарна.</p>
            <Link className="btn" href="/#tests">
              Тест эхлүүлэх
            </Link>
          </>
        ) : null}
        <div className="catalog">
          {tracks.map((track) => (
            <article key={track.id} className="row row-progress">
              <span className={`swatch swatch-${swatchKind(track.kind)}`} aria-hidden="true" />
              <div>
                <span className="row-title">{track.title}</span>
                <StatusBar progress={track.progress} />
                <Link href={track.href} className="btn">
                  {track.action}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Link href="/account/photos" className="btn-quiet">
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

function ageLabel(age: string) {
  if (age === "adult") return "Насанд хүрсэн";
  if (age === "under18") return "18-аас доош";
  return "Ороогүй";
}

function swatchKind(kind: string) {
  if (kind === "personality" || kind === "personality_report") return "personality";
  if (kind === "stress" || kind === "fun" || kind === "youth") return kind;
  return "style";
}
