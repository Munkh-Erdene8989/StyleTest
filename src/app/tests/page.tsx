import type { Metadata } from "next";
import Link from "next/link";
import { AI_QUIZ_CATALOG } from "@/content/quizzes/catalog";
import { formatMnt } from "@/lib/format";
import { archetypeAvailable } from "@/server/ai-quiz-banks";
import { currentQuizPrice } from "@/server/quiz-price";

export async function generateMetadata(): Promise<Metadata> {
  const price = await currentQuizPrice();
  return {
    title: "Тестүүд",
    description: `Нүүр, биеийн хэлбэр, хувийн хэв маягийн тест. Тест бүр ${formatMnt(price)}₮. Төлсний дараа бүрэн тайлан цахим шуудангаар очно.`,
  };
}

export default async function TestsPage() {
  const price = await currentQuizPrice();
  const archetypeReady = archetypeAvailable();
  return (
    <main>
      <p className="kicker">Тест</p>
      <h1>
        Хувийн <em>тайлан</em>
      </h1>
      <p className="lede">Тест бүр {formatMnt(price)}₮. Төлсний дараа бүрэн тайлан таны оруулсан цахим шуудан руу очно.</p>
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
      </div>
    </main>
  );
}
