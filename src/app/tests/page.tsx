import type { Metadata } from "next";
import { spreadFor, TestSpread } from "@/components/test-spread";
import { PUBLIC_NOTICE } from "@/domain/brand";
import { optionalUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Тест",
  description: "Naruka Styling Studio-ийн онлайн стайл тест. Насанд тохирсон асуулга, товч үр дүн.",
};

export default async function TestsPage() {
  const user = await optionalUser();
  const age = user?.ageBand ?? "unknown";
  const { items, under18 } = await spreadFor(age);
  return (
    <main className="spread-page">
      <div className="band-head">
        <p className="kicker">Тест</p>
        <h1>
          Танд нээлттэй <em>асуулга</em>
        </h1>
      </div>
      <TestSpread items={items} />
      <p className="note">{PUBLIC_NOTICE}</p>
      {under18 ? <p className="note">18-аас доош насанд зурагтай стайл, төлбөртэй тайлан хаалттай.</p> : null}
    </main>
  );
}
