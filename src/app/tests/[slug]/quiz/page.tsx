import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CatalogQuiz } from "@/components/catalog-quiz";
import { quizBySlug } from "@/content/quizzes/catalog";
import { listedOnSite } from "@/domain/admin-content";
import { testBySlug } from "@/server/catalog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const row = await testBySlug(slug);
  if (!row || !listedOnSite(row)) return { title: "Тест" };
  return { title: row.version.title, description: row.version.description };
}

export default async function TestQuizPage({ params }: Params) {
  const { slug } = await params;
  if (quizBySlug(slug)) redirect(`/tests/${slug}`);
  const row = await testBySlug(slug);
  if (!row || !listedOnSite(row)) notFound();
  return (
    <main>
      <p className="kicker">Тест</p>
      <h1>{row.version.title}</h1>
      <p className="lede">{row.version.description}</p>
      <CatalogQuiz
        slug={row.test.slug}
        disclaimer={row.version.disclaimer}
        questions={row.version.questions.map((question) => ({
          id: question.id,
          text: question.text,
          options: question.options.map((option) => ({ id: option.id, label: option.label })),
        }))}
      />
    </main>
  );
}
