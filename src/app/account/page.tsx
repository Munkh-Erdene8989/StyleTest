import Link from "next/link";
import { DeleteAccountForm, RefundForm } from "@/components/account-actions";
import { ProfileForm } from "@/components/profile-form";
import { ReportDownloads } from "@/components/report-downloads";
import { StatusBar } from "@/components/status-bar";
import { optionalUser } from "@/server/auth";
import { loadProfile } from "@/server/profile-service";
import { listAccountTracks } from "@/server/result-service";
import { getStore } from "@/server/store";

export default async function AccountPage() {
  const user = await optionalUser();
  if (!user) {
    return (
      <main>
        <h1>Миний хэсэг</h1>
        <p>Тест эхлүүлэхэд төрсөн өдөр нэг удаа бүртгэгдэнэ. Нэвтэрсний дараа энд харагдана.</p>
        <Link className="btn" href="/quiz">
          Тест эхлүүлэх
        </Link>
      </main>
    );
  }
  const store = getStore();
  const [tracks, profile] = await Promise.all([listAccountTracks(user), loadProfile(user)]);
  const openTracks = tracks.filter((track) => track.open);
  const orders = (await store.listOrdersByOwner(user.id)).filter((order) => order.paymentStatus === "paid" || order.paymentStatus === "refund_requested");
  return (
    <main>
      <h1>Миний хэсэг</h1>
      <ProfileForm
        dateOfBirth={profile.dateOfBirth ?? ""}
        age={profile.age}
        gender={profile.gender ?? ""}
        email={profile.email ?? ""}
        phone={profile.phone ?? ""}
        bodyShape={profile.bodyShape}
        faceShape={profile.faceShape}
        bodyFigure={profile.bodyFigure ?? ""}
      />
      <section className="stack-form">
        <h2>Бөглөсөн тайлан</h2>
        <ReportDownloads reports={profile.reports} />
      </section>
      {openTracks.length > 0 ? (
        <section className="stack-form">
          <h2>Үргэлжилж буй</h2>
          <div className="catalog">
            {openTracks.map((track) => (
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
      ) : null}
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

function swatchKind(kind: string) {
  if (kind === "personality" || kind === "personality_report") return "personality";
  if (kind === "stress" || kind === "fun" || kind === "youth") return kind;
  return "style";
}
