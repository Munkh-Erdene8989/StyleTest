import type { Metadata } from "next";
import StyleQuiz from "@/server/StyleQuiz";

export const metadata: Metadata = {
  title: "Стайл тест",
  description: "Хувийн өнгө, силуэт, стайлын тайлан. 150₮. Хариултыг хиймэл оюун ухаанаар шинжилж имэйлээр илгээнэ.",
};

export default function QuizPage() {
  return <StyleQuiz />;
}
