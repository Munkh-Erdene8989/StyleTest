import { redirect } from "next/navigation";
import { StyleWizard } from "@/components/style-wizard";
import { STYLE_EXAMPLES } from "@/domain/content";
import { optionalUser } from "@/server/auth";
import { getStore } from "@/server/store";
import { createStyleSession } from "@/server/session-service";

export default async function StylePage() {
  const user = await optionalUser();
  if (!user || user.ageBand === "unknown") redirect("/");
  if (user.ageBand !== "adult") {
    return (
      <main>
        <h1>Стайл</h1>
        <p>Зурагтай стайлын үйлчилгээ 18-аас дээш насныханд нээлттэй.</p>
      </main>
    );
  }
  const store = getStore();
  const sessions = await store.listSessionsByOwner(user.id);
  const existing = sessions.find((session) => session.kind === "style" && session.status === "in_progress");
  const session = existing ?? (await createStyleSession(user));
  const personality = sessions.find((item) => item.kind === "personality" && item.status === "completed");
  return (
    <main>
      <h1>Стайлын зөвлөмж</h1>
      <p>Дуртай хувцас гол шалгуур. Зургаас зан төлөв, сэтгэцийн шинж тогтоохгүй. Үнэ, брэнд, дэлгүүр санал болгохгүй.</p>
      <StyleWizard
        sessionId={session.id}
        personalitySessionId={personality?.id}
        examples={STYLE_EXAMPLES.map((item) => ({ id: item.id, title: item.title, paletteFamily: item.paletteFamily }))}
      />
    </main>
  );
}
