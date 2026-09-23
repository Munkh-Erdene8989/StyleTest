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
    <section className="stack-form">
      <p className="row-meta" role="status">
        {progress} / {questions.length}
      </p>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${(progress / questions.length) * 100}%` }} />
      </div>
      <fieldset>
        <legend className="question">{question.text}</legend>
        {question.options.map((option) => (
          <label key={option.id} className="choice">
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
      <div className="actions">
        <button type="button" className="btn-quiet" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          Өмнөх
        </button>
        {index === questions.length - 1 ? (
          <button type="button" className="btn" onClick={() => void finish()} disabled={pending || !answers[question.id]}>
            {pending ? "Боловсруулж байна…" : "Дуусгах"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
