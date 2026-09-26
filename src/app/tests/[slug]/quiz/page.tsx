import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { QuizRunner } from "@/components/quiz-runner";
import { AppError } from "@/domain/errors";
import { noIndex } from "@/lib/seo";
import { optionalUser } from "@/server/auth";
import { testBySlug } from "@/server/catalog";
import { createQuizSession, resumeSession } from "@/server/session-service";

export const metadata: Metadata = noIndex;

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await testBySlug(slug);
  if (!row) notFound();
  const user = await optionalUser();
  if (!user || user.ageBand === "unknown") redirect(`/tests/${slug}`);
  const version = row.version;
  try {
    const session = (await resumeSession(user, slug)) ?? (await createQuizSession(user, slug));
    const questions = version.questions.map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options.map((option) => ({ id: option.id, label: option.label })),
    }));
    return (
      <main>
        <QuizRunner slug={slug} sessionId={session.id} questions={questions} initialAnswers={session.answers} />
      </main>
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "age_restricted") {
      return (
        <main>
          <h1>Насанд тохирохгүй</h1>
          <p>Энэ тест таны насны бүлэгт нээлттэй биш.</p>
        </main>
      );
    }
    throw error;
  }
}
