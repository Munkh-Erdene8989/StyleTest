"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PublicQuestion = {
  id: string;
  text: string;
  options: { id: string; label: string }[];
};

const errors: Record<string, string> = {
  age_restricted: "Энэ тест таны насанд нээлттэй биш.",
  unauthorized: "Нэвтрэлт шаардлагатай. Хуудсыг дахин ачаалаад үзнэ үү.",
  not_found: "Энэ тест сайт дээр хаагдсан байна.",
};

export function CatalogQuiz({
  slug,
  disclaimer,
  questions,
}: {
  slug: string;
  disclaimer: string;
  questions: PublicQuestion[];
}) {
  const router = useRouter();
  const sessionRef = useRef("");
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const question = questions[index];

  async function sessionId() {
    if (sessionRef.current) return sessionRef.current;
    await fetch("/api/auth/guest", { method: "POST" });
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!response.ok || !data.id) throw new Error(data.error || "start");
    sessionRef.current = data.id;
    return data.id;
  }

  async function choose(optionId: string) {
    if (!question || pending) return;
    setPending(true);
    setError("");
    try {
      const id = await sessionId();
      const saved = await fetch(`/api/sessions/${id}/answers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: { [question.id]: optionId } }),
      });
      if (!saved.ok) {
        const data = (await saved.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "save");
      }
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setPending(false);
        return;
      }
      const done = await fetch(`/api/sessions/${id}/complete`, { method: "POST" });
      if (!done.ok) {
        const data = (await done.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "complete");
      }
      router.push(`/sessions/${id}`);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "start";
      setError(errors[code] ?? "Хадгалж чадсангүй. Дахин оролдоно уу.");
      setPending(false);
    }
  }

  if (!question) return null;

  return (
    <section className="stack-form">
      <p className="row-meta">
        Асуулт {index + 1} / {questions.length}
      </p>
      <h2>{question.text}</h2>
      <div className="stack-form">
        {question.options.map((option) => (
          <button key={option.id} type="button" className="btn" disabled={pending} onClick={() => void choose(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
      {error ? <p className="alert">{error}</p> : null}
      <p className="row-meta">{disclaimer}</p>
    </section>
  );
}
