import type { Metadata } from "next";
import { BodyCalculator } from "@/components/body-calculator";

export const metadata: Metadata = {
  title: "Биеийн хэлбэр",
  description: "Цээж, бэлхүүс, ташааны хэмжээсээр биеийн харьцаагаа харах.",
};

export default function BodyShapePage() {
  return (
    <main className="body-page">
      <p className="kicker">Таны биеийн харьцаа</p>
      <h1>
        Биеийн <em>хэлбэр</em>
      </h1>
      <p className="lede">Хэмжээсээ оруулаад биеийн хэлбэр, харьцаагаа дүрслэлээр хараарай.</p>
      <BodyCalculator />
    </main>
  );
}
