"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = { id: string; text: string; options: { id: string; label: string }[] };

export function QuizRunner({
  sessionId,
  questions,
  initialAnswers,
}: {
  slug: string;
  sessionId: string;
  questions: Question[];
  initialAnswers: Record<string, string>;
}) {
  const router = useRouter();
  const startIndex = useMemo(() => {
    const index = questions.findIndex((question) => !initialAnswers[question.id]);
    return index === -1 ? questions.length - 1 : index;
  }, [questions, initialAnswers]);
  const [index, setIndex] = useState(startIndex);
  const [answers, setAnswers] = useState(initialAnswers);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const question = questions[index];
  const progress = Object.keys(answers).length;

  async function choose(optionId: string) {
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    setError("");
    const response = await fetch(`/api/sessions/${sessionId}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: { [question.id]: optionId } }),
    });
    if (!response.ok) {
      setError("Хариулт хадгалагдсангүй. Дахин оролдоно уу.");
      return;
    }
    if (index < questions.length - 1) setIndex(index + 1);
  }

  async function finish() {
    setPending(true);
    const response = await fetch(`/api/sessions/${sessionId}/complete`, { method: "POST" });
    setPending(false);
    if (!response.ok) {
      setError("Бүх асуултад хариулсны дараа дуусгана.");
      return;
    }
    router.push(`/sessions/${sessionId}`);
  }

  if (!question) return <p>Асуулт алга.</p>;

  return (
    <section className="grid gap-4">
      <p role="status">
        {progress} / {questions.length}
      </p>
      <div className="h-2 rounded-full bg-stone-200" aria-hidden="true">
        <div className="h-2 rounded-full bg-teal-800" style={{ width: `${(progress / questions.length) * 100}%` }} />
      </div>
      <fieldset className="grid gap-3">
        <legend className="text-xl font-semibold leading-snug">{question.text}</legend>
        {question.options.map((option) => (
          <label key={option.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 bg-white px-3">
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={answers[question.id] === option.id}
              onChange={() => void choose(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <button
          type="button"
          className="min-h-12 flex-1 rounded-xl border border-stone-300"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          Өмнөх
        </button>
        {index === questions.length - 1 ? (
          <button type="button" className="min-h-12 flex-1 rounded-xl bg-teal-800 text-white" onClick={() => void finish()} disabled={pending || !answers[question.id]}>
            {pending ? "Боловсруулж байна…" : "Дуусгах"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-rose-800">
          {error}
        </p>
      ) : null}
    </section>
  );
}
