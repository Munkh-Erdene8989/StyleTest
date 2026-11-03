import type { Metadata } from "next";
import Link from "next/link";
import { AI_QUIZ_CATALOG } from "@/content/quizzes/catalog";
import { listedOnSite } from "@/domain/admin-content";
import { canStartTest } from "@/domain/age";
import { formatMnt } from "@/lib/format";
import { archetypeAvailable } from "@/server/ai-quiz-banks";
import { optionalUser } from "@/server/auth";
import { loadCatalog } from "@/server/catalog";
import { currentQuizPrice } from "@/server/quiz-price";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const price = await currentQuizPrice();
  return {
    title: "Тестүүд",
    description: `Нүүр, биеийн хэлбэр, хувийн хэв маягийн тест ${formatMnt(price)}₮. Админ нээсэн асуулга мөн энд гарна.`,
  };
}

export default async function TestsPage() {
  const price = await currentQuizPrice();
  const archetypeReady = archetypeAvailable();
  const user = await optionalUser();
  const age = user?.ageBand === "under18" ? "under18" : "adult";
  const catalog = (await loadCatalog()).filter((row) => listedOnSite(row) && canStartTest(row.version.kind, age));
  return (
    <main>
      <p className="kicker">Тест</p>
      <h1>
        Хувийн <em>тайлан</em>
      </h1>
      <p className="lede">Нүүр, бие, хэв маягийн тест {formatMnt(price)}₮. Админ нээсэн асуулга доор харагдана.</p>
      <div className="stack-form">
        {AI_QUIZ_CATALOG.map((quiz) => {
          const waiting = quiz.kind === "archetype" && !archetypeReady;
          return (
            <article key={quiz.slug}>
              <h2>{quiz.title}</h2>
              <p>{quiz.description}</p>
              <p className="row-meta">
                {quiz.minutes} минут · {formatMnt(price)}₮
              </p>
              {waiting ? <p>Асуултын файл хүлээгдэж байна.</p> : <Link className="btn" href={`/tests/${quiz.slug}`}>Эхлүүлэх</Link>}
            </article>
          );
        })}
        {catalog.map(({ test, version }) => (
          <article key={version.id}>
            <h2>{version.title}</h2>
            <p>{version.description}</p>
            <p className="row-meta">
              {version.questions.length} асуулт · {version.minutes} минут
              {test.priceMnt > 0 ? ` · ${formatMnt(test.priceMnt)}₮` : " · үнэгүй"}
            </p>
            <Link className="btn" href={`/tests/${test.slug}/quiz`}>
              Эхлүүлэх
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
