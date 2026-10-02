import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { quizBySlug } from "@/content/quizzes/catalog";
import { AiQuizRunner } from "@/components/ai-quiz-runner";
import { STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import { archetypeAvailable, publicQuestions } from "@/server/ai-quiz-banks";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const quiz = quizBySlug(slug);
  if (!quiz) return { title: "Тест" };
  return { title: quiz.title, description: quiz.description };
}

export default async function AiQuizPage({ params }: Params) {
  const { slug } = await params;
  const quiz = quizBySlug(slug);
  if (!quiz) redirect("/quiz");
  if (quiz.kind === "archetype" && !archetypeAvailable()) {
    return (
      <main>
        <p className="kicker">Тест</p>
        <h1>{quiz.title}</h1>
        <p>Асуултын файл хүлээгдэж байна.</p>
      </main>
    );
  }
  const questions = publicQuestions(quiz.kind);
  if (!questions.length) notFound();
  return (
    <main>
      <AiQuizRunner kind={quiz.kind} title={quiz.title} description={quiz.description} questions={questions} price={STYLE_QUIZ_PRICE_MNT} />
    </main>
  );
}
