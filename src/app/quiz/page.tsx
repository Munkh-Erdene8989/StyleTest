import type { Metadata } from "next";
import StyleQuiz from "@/server/StyleQuiz";
import { formatMnt } from "@/lib/format";
import { currentQuizPrice } from "@/server/quiz-price";

export async function generateMetadata(): Promise<Metadata> {
  const price = await currentQuizPrice();
  return {
    title: "Стайл тест",
    description: `Хувийн өнгө, силуэт, стайлын тайлан. ${formatMnt(price)}₮. Хариултыг хиймэл оюун ухаанаар шинжилж имэйлээр илгээнэ.`,
  };
}

export default async function QuizPage() {
  return <StyleQuiz price={await currentQuizPrice()} />;
}
