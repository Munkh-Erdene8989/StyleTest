import type { Metadata } from "next";
import Link from "next/link";
import { AI_QUIZ_CATALOG } from "@/content/quizzes/catalog";
import { STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import { formatMnt } from "@/lib/format";
import { archetypeAvailable } from "@/server/ai-quiz-banks";

export const metadata: Metadata = {
  title: "Тестүүд",
  description: "Нүүр, биеийн хэлбэр, хувийн стилийн тест. Тест бүр 150₮. Төлсний дараа товч тайлан, дэлгэрэнгүй тайлан имэйлээр.",
};

export default function TestsPage() {
  const archetypeReady = archetypeAvailable();
  return (
    <main>
      <p className="kicker">Тест</p>
      <h1>
        Хувийн <em>тайлан</em>
      </h1>
      <p className="lede">Тест бүр {formatMnt(STYLE_QUIZ_PRICE_MNT)}₮. Төлсний дараа товч тайлан гарна. Дэлгэрэнгүй тайлан таны оруулсан имэйл рүү очно.</p>
      <div className="stack-form">
        {AI_QUIZ_CATALOG.map((quiz) => {
          const waiting = quiz.kind === "archetype" && !archetypeReady;
          return (
            <article key={quiz.slug}>
              <h2>{quiz.title}</h2>
              <p>{quiz.description}</p>
              <p className="row-meta">
                {quiz.minutes} минут · {formatMnt(STYLE_QUIZ_PRICE_MNT)}₮
              </p>
              {waiting ? <p>Асуултын файл хүлээгдэж байна.</p> : <Link className="btn" href={`/tests/${quiz.slug}`}>Эхлүүлэх</Link>}
            </article>
          );
        })}
      </div>
    </main>
  );
}
