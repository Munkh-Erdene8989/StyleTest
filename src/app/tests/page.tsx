import type { Metadata } from "next";
import { AgeForm } from "@/components/age-form";
import { spreadFor, TestSpread } from "@/components/test-spread";
import { optionalUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Тест",
  description: "Naruka Styling Studio-ийн онлайн стайл тест. Насанд тохирсон асуулга, товч үр дүн.",
};

export default async function TestsPage() {
  const user = await optionalUser();
  const age = user?.ageBand ?? "unknown";
  const { items, locked, under18 } = await spreadFor(age, "#start");
  return (
    <main className="spread-page">
      <div className="band-head">
        <p className="kicker">Тест</p>
        <h1>
          Танд нээлттэй <em>асуулга</em>
        </h1>
      </div>
      {locked ? (
        <div id="start">
          <p>Эхлээд төрсөн өдрөө оруулна уу. Дараа нь доорх тестүүд нээгдэнэ.</p>
          <AgeForm />
        </div>
      ) : null}
      <TestSpread items={items} />
      {under18 ? <p className="note">18-аас доош насанд зурагтай стайл, төлбөртэй тайлан хаалттай.</p> : null}
    </main>
  );
}
