"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AiAnswer, AiQuizKind, PublicAiQuestion } from "@/domain/ai-quiz";
import { formatMnt } from "@/lib/format";

type Checkout = {
  id: string;
  amount: number;
  paymentStatus: "invoiced" | "paid";
  email: string;
  qrImage?: string;
  urls: { name: string; link: string }[];
  simulate: boolean;
  reportStatus: "pending" | "sending" | "sent" | "failed";
  brief: { title: string; sections: { heading: string; body: string }[] } | null;
};

type Stage = "intro" | "questions" | "email";

function checkoutError(code?: string) {
  if (code === "invalid_contact") return "И-мэйл хаягаа зөв оруулна уу.";
  if (code === "answers_incomplete") return "Бүх асуултад хариулна уу.";
  if (code === "qpay_invoice" || code === "qpay_callback_missing") return "QPay нэхэмжлэх үүсгэж чадсангүй. Түр хүлээгээд дахин оролдоно уу.";
  return "Илгээж чадсангүй. Дахин оролдоно уу.";
}

const INTRO: Record<AiQuizKind, { kicker: string; title: string; emphasis?: string; body: string; stats: [string, string][] }> = {
  face_beauty: {
    kicker: "Шинэ · AI Beauty Analysis",
    title: "Face & Beauty",
    emphasis: "Style",
    body: "32 асуултаар нүүрний хэлбэр, өнгө, контраст, essence-ийг тодорхойлно. Төлсний дараа товч тайлан гарна.",
    stats: [
      ["32", "асуулт"],
      ["5–8", "минут"],
      ["5", "шинжилгээ"],
    ],
  },
  body_shape: {
    kicker: "Шинэ · Биеийн шугамын тест",
    title: "Миний биеийн хэлбэр",
    body: "Харьцаа, хувцасны суулт, тав тухаа ажиглаж, биеийн хэлбэрт ойр хувцасны чиглэл авна.",
    stats: [
      ["24", "асуулт"],
      ["6–10", "минут"],
      ["5", "хэлбэр"],
    ],
  },
  archetype: {
    kicker: "Шинэ · Хувийн шинжилгээ",
    title: "Таны гол архетип юу вэ?",
    body: "Зөв, буруу хариулт байхгүй. Сүүлийн үеийн бодит зан үйлдээ тулгуурлан хамгийн ойр санагдсан хариултыг сонгоно уу.",
    stats: [
      ["40", "мэдэгдэл"],
      ["5–8", "минут"],
      ["10", "чадвар"],
    ],
  },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AiQuizRunner({
  kind,
  questions,
  price,
}: {
  kind: AiQuizKind;
  title: string;
  description: string;
  questions: PublicAiQuestion[];
  price: number;
}) {
  const router = useRouter();
  const intro = INTRO[kind];
  const slug = kind === "face_beauty" ? "face" : kind === "body_shape" ? "body" : "archetype";
  const storageKey = `naruka-ai-quiz-${slug}`;
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AiAnswer>>({});
  const [email, setEmail] = useState("");
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [restored, setRestored] = useState(false);
  const question = questions[index];

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null") as {
        answers?: Record<string, AiAnswer>;
        index?: number;
        email?: string;
        stage?: Stage;
      } | null;
      if (saved?.answers && Object.keys(saved.answers).length) {
        setAnswers(saved.answers);
        setIndex(Math.min(saved.index ?? 0, Math.max(questions.length - 1, 0)));
        if (saved.email) setEmail(saved.email);
        if (saved.stage === "questions" || saved.stage === "email") setStage(saved.stage);
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
    setRestored(true);
  }, [questions.length, storageKey]);

  useEffect(() => {
    if (!restored || stage === "intro") return;
    sessionStorage.setItem(storageKey, JSON.stringify({ answers, index, email, stage }));
  }, [answers, email, index, restored, stage, storageKey]);

  useEffect(() => {
    if (!checkout || checkout.paymentStatus === "paid") return;
    if (checkout.simulate && !checkout.qrImage && checkout.urls.length === 0) return;
    const timer = window.setInterval(() => {
      void refresh(checkout.id, false);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [checkout]);

  useEffect(() => {
    if (!checkout || checkout.paymentStatus !== "paid") return;
    if (checkout.reportStatus !== "pending" && checkout.reportStatus !== "sending") return;
    const timer = window.setInterval(() => {
      void refresh(checkout.id, false);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [checkout]);

  const progress =
    checkout?.paymentStatus === "paid" ? 100 : stage === "intro" ? 0 : stage === "email" ? 94 : Math.round(6 + ((index + 1) / questions.length) * 84);

  async function refresh(id: string, confirm: boolean) {
    const response = await fetch(confirm ? `/api/ai-quiz/${id}/confirm` : `/api/ai-quiz/${id}`, { method: confirm ? "POST" : "GET" });
    if (!response.ok) return;
    const payload = (await response.json()) as Checkout & { quiz?: Checkout };
    setCheckout(payload.quiz ?? payload);
  }

  async function submit(deliveryEmail: string) {
    setPending(true);
    setError("");
    try {
      await fetch("/api/auth/guest", { method: "POST" });
      const response = await fetch("/api/ai-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, answers, email: deliveryEmail }),
      });
      const payload = (await response.json()) as Checkout & { error?: string };
      if (!response.ok) {
        setError(checkoutError(payload.error));
        return;
      }
      sessionStorage.removeItem(storageKey);
      setCheckout(payload);
    } finally {
      setPending(false);
    }
  }

  async function simulate() {
    if (!checkout) return;
    setPending(true);
    const response = await fetch(`/api/ai-quiz/${checkout.id}/simulate`, { method: "POST" });
    const payload = (await response.json()) as { quiz?: Checkout };
    setPending(false);
    if (response.ok && payload.quiz) setCheckout(payload.quiz);
  }

  async function retry() {
    if (!checkout) return;
    setPending(true);
    const response = await fetch(`/api/ai-quiz/${checkout.id}/retry`, { method: "POST" });
    const payload = (await response.json()) as Checkout;
    setPending(false);
    if (response.ok) setCheckout(payload);
  }

  function finishQuestions() {
    setError("");
    setStage("email");
  }

  function chooseSingle(optionId: string) {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: { type: "single", optionId } }));
    setError("");
    window.setTimeout(() => {
      if (index === questions.length - 1) setStage("email");
      else setIndex((value) => value + 1);
    }, 180);
  }

  function goNext() {
    if (!question) return;
    if (question.required && !answers[question.id]) {
      setError("Энэ асуултад хариулна уу.");
      return;
    }
    setError("");
    if (index === questions.length - 1) finishQuestions();
    else setIndex(index + 1);
  }

  function goBack() {
    setError("");
    if (checkout) return;
    if (stage === "email") {
      setStage("questions");
      setIndex(questions.length - 1);
      return;
    }
    if (stage === "questions" && index > 0) setIndex(index - 1);
    else setStage("intro");
  }

  let body = null;
  if (checkout?.paymentStatus === "paid" && checkout.brief) {
    body = (
      <section className="animate-[fadeIn_.3s_ease-out] overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 shadow-xl shadow-charcoal/5 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-bordeaux to-bordeaux-light px-6 py-10 text-center text-white sm:px-10">
          <p className="mx-auto mb-4 w-fit rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-light">Товч тайлан</p>
          <h2 className="quiz-hero">{checkout.brief.title}</h2>
        </div>
        <div className="space-y-4 p-5 sm:p-9">
          {checkout.brief.sections.map((section) => (
            <article key={section.heading} className="rounded-2xl border border-cream-dark bg-white p-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">{section.heading}</p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{section.body}</p>
            </article>
          ))}
          <ReportStatus checkout={checkout} pending={pending} onRetry={() => void retry()} />
        </div>
      </section>
    );
  } else if (checkout) {
    body = (
      <section className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
        <p className="mb-4 w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">Төлбөр</p>
        <h2 className="quiz-question">Товч тайлангийн өмнө</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {formatMnt(checkout.amount)}₮. Төлбөр баталгаажмагц товч тайлан гарна. Дэлгэрэнгүй тайлан бэлэн болмогц {checkout.email} хаяг руу очно.
        </p>
        {checkout.qrImage ? <img src={checkout.qrImage} alt="QPay QR" className="mx-auto mt-6 w-56 rounded-2xl bg-white p-3" /> : null}
        <div className="mt-6 grid gap-3">
          {checkout.urls.map((url) => (
            <a key={url.link} href={url.link} className="rounded-full bg-bordeaux px-6 py-4 text-center font-semibold text-white">
              {url.name}
            </a>
          ))}
          {checkout.qrImage || checkout.urls.length ? (
            <button type="button" onClick={() => void refresh(checkout.id, true)} className="rounded-full border border-cream-dark bg-white px-6 py-4 text-sm font-semibold text-charcoal">
              Төлбөр шалгах
            </button>
          ) : null}
          {checkout.simulate ? (
            <button type="button" onClick={() => void simulate()} disabled={pending} className="rounded-full border border-bordeaux px-6 py-4 text-sm font-semibold text-bordeaux disabled:opacity-60">
              Туршилтын төлбөр баталгаажуулах
            </button>
          ) : null}
        </div>
      </section>
    );
  } else if (stage === "email") {
    body = (
      <section className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
        <p className="mb-4 w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">Тайлангаа хадгалаарай</p>
        <h2 className="quiz-question">Үр дүнг тань хаашаа илгээх вэ?</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Дэлгэрэнгүй тайлан энэ хаяг руу очно. Төлбөр баталгаажсаны дараа товч тайлан энд гарна.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const next = email.trim().toLowerCase();
            if (!EMAIL.test(next)) {
              setError("И-мэйл хаягаа шалгана уу.");
              return;
            }
            void submit(next);
          }}
        >
          <label className="block text-sm text-muted">
            И-мэйл
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-cream-dark bg-white p-4 text-charcoal outline-none focus:border-bordeaux"
            />
          </label>
          <button type="submit" disabled={pending} className="w-full rounded-full bg-bordeaux px-6 py-4 font-semibold text-white shadow-lg shadow-bordeaux/15 transition hover:bg-bordeaux-dark disabled:opacity-60">
            {pending ? "Хадгалж байна…" : `${formatMnt(price)}₮ төлөх`}
          </button>
        </form>
      </section>
    );
  } else if (stage === "intro" || !question) {
    body = (
      <section className="animate-[fadeIn_.3s_ease-out] overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 shadow-xl shadow-charcoal/5 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-bordeaux via-bordeaux to-bordeaux-light px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <p className="relative mx-auto mb-5 w-fit rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-light">{intro.kicker}</p>
          <h2 className="quiz-hero">
            {intro.title}
            {intro.emphasis ? (
              <>
                <br />
                <em className="text-gold-light">{intro.emphasis}</em>
              </>
            ) : null}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">{intro.body}</p>
        </div>
        <div className="p-6 sm:p-10">
          <div className="grid grid-cols-3 divide-x divide-cream-dark rounded-2xl bg-cream-dark/60 py-5 text-center">
            {intro.stats.map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-2xl text-bordeaux">{value}</p>
                <p className="mt-1 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setStage("questions")} className="mt-7 w-full rounded-full bg-bordeaux px-6 py-4 font-semibold text-white shadow-lg shadow-bordeaux/15 transition hover:-translate-y-0.5 hover:bg-bordeaux-dark">
            {Object.keys(answers).length ? "Үргэлжлүүлэх" : "Тестээ эхлүүлэх"}
          </button>
          <p className="mt-4 text-center text-xs text-muted">Тест бүр {formatMnt(price)}₮. Төлсний дараа товч тайлан, дэлгэрэнгүй тайлан таны оруулсан имэйл рүү.</p>
        </div>
      </section>
    );
  } else {
    const single = question.type === "single";
    body = (
      <section key={question.id} className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">{question.sectionTitle || intro.title}</p>
          <p className="text-xs font-medium text-muted">
            {index + 1} / {questions.length}
          </p>
        </div>
        <h2 className="quiz-question">{question.text}</h2>
        {question.help ? <p className="mt-3 text-sm leading-relaxed text-muted">{question.help}</p> : null}
        <div className="mt-8">
          <QuestionChoices question={question} answer={answers[question.id]} onSingle={chooseSingle} onChange={(answer) => {
            setAnswers((current) => {
              const next = { ...current };
              if (!answer) delete next[question.id];
              else next[question.id] = answer;
              return next;
            });
          }} />
        </div>
        {single ? null : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {!question.required ? (
              <button type="button" onClick={() => {
                setAnswers((current) => {
                  const next = { ...current };
                  delete next[question.id];
                  return next;
                });
                if (index === questions.length - 1) finishQuestions();
                else setIndex(index + 1);
              }} className="rounded-full border border-cream-dark bg-white px-6 py-4 text-sm font-semibold text-muted">
                Алгасах
              </button>
            ) : null}
            <button type="button" onClick={goNext} className="rounded-full bg-bordeaux px-6 py-4 font-semibold text-white sm:col-start-2">
              {index === questions.length - 1 ? "И-мэйл рүү" : "Дараагийн асуулт"}
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="quiz-shell fixed inset-0 z-[80] overflow-y-auto bg-cream text-charcoal">
      <div className="pointer-events-none fixed -left-28 top-32 size-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-36 bottom-8 size-96 rounded-full bg-bordeaux/10 blur-3xl" />
      <header className="sticky top-0 z-20 border-b border-cream-dark bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <button type="button" onClick={() => router.push("/tests")} aria-label="Тест хаах" className="flex size-10 items-center justify-center rounded-full text-xl text-charcoal-soft transition hover:bg-white">
            ×
          </button>
          <img src="/naruka-logo.png" alt="Naruka Styling Studio" className="h-9 w-auto object-contain brightness-0" />
          <button type="button" onClick={goBack} disabled={stage === "intro" || Boolean(checkout)} className="rounded-full px-3 py-2 text-sm font-semibold text-bordeaux transition hover:bg-blush disabled:invisible">
            Буцах
          </button>
        </div>
        <div className="h-1 bg-cream-dark">
          <div className="h-full rounded-r-full bg-gradient-to-r from-gold to-bordeaux transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>
      <main className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-4 py-7 sm:px-5 sm:py-10">
        {body}
        {error ? (
          <p role="alert" className="mt-4 text-center text-sm font-medium text-bordeaux">
            {error}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function ReportStatus({ checkout, pending, onRetry }: { checkout: Checkout; pending: boolean; onRetry: () => void }) {
  if (checkout.reportStatus === "sent") {
    return <p role="status" className="text-center text-sm text-muted">Дэлгэрэнгүй тайланг {checkout.email} хаяг руу илгээлээ.</p>;
  }
  if (checkout.reportStatus === "failed") {
    return (
      <div className="text-center">
        <p role="alert" className="text-sm text-bordeaux">Дэлгэрэнгүй тайлан илгээгдсэнгүй. Дахин төлбөр авахгүй.</p>
        <button type="button" onClick={onRetry} disabled={pending} className="mt-4 rounded-full bg-bordeaux px-6 py-3 text-sm font-semibold text-white">
          Дахин илгээх
        </button>
      </div>
    );
  }
  return <p role="status" className="text-center text-sm text-muted">Дэлгэрэнгүй тайлан бэлтгэгдэж байна. Бэлэн болмогц {checkout.email} хаяг руу очно.</p>;
}

function optionClass(selected: boolean) {
  return `flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${selected ? "border-bordeaux bg-bordeaux text-white shadow-md shadow-bordeaux/15" : "border-cream-dark bg-white text-charcoal hover:-translate-y-0.5 hover:border-gold hover:shadow-md"}`;
}

function badgeClass(selected: boolean) {
  return `flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase ${selected ? "bg-white text-bordeaux" : "bg-cream-dark text-bordeaux"}`;
}

function QuestionChoices({
  question,
  answer,
  onSingle,
  onChange,
}: {
  question: PublicAiQuestion;
  answer: AiAnswer | undefined;
  onSingle: (optionId: string) => void;
  onChange: (answer: AiAnswer | null) => void;
}) {
  if (question.type === "single") {
    return (
      <div className="space-y-3">
        {question.options?.map((option) => {
          const selected = answer?.type === "single" && answer.optionId === option.id;
          return (
            <button key={option.id} type="button" onClick={() => onSingle(option.id)} className={optionClass(selected)}>
              <span className={badgeClass(selected)}>{option.id.replace(/^.*_o/, "").slice(0, 2)}</span>
              <span className="text-sm font-semibold leading-snug sm:text-base">{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
  if (question.type === "multiple") {
    const selected = answer?.type === "multiple" ? answer.optionIds : [];
    return (
      <div className="space-y-3">
        {question.options?.map((option) => {
          const on = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                const optionIds = on ? selected.filter((id) => id !== option.id) : [...selected, option.id];
                onChange(optionIds.length ? { type: "multiple", optionIds } : null);
              }}
              className={optionClass(on)}
            >
              <span className={badgeClass(on)}>{on ? "✓" : ""}</span>
              <span className="text-sm font-semibold">{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
  if (question.type === "number") {
    const value = answer?.type === "number" && answer.value !== null ? String(answer.value) : "";
    const confirmed = answer?.type === "number" ? answer.confirmed : false;
    return (
      <div className="space-y-4">
        <label className="block text-sm text-muted">
          {question.unit || "Тоо"}
          <input
            inputMode="decimal"
            value={value}
            onChange={(event) => {
              const next = event.target.value.trim();
              if (!next) {
                onChange(null);
                return;
              }
              const parsed = Number(next);
              if (Number.isFinite(parsed)) onChange({ type: "number", value: parsed, confirmed });
            }}
            className="mt-2 w-full rounded-2xl border border-cream-dark bg-white p-4 text-charcoal outline-none focus:border-bordeaux"
          />
        </label>
        {question.confirmLabel ? (
          <label className="flex items-start gap-3 rounded-2xl border border-cream-dark bg-white p-4 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => onChange({ type: "number", value: answer?.type === "number" ? answer.value : null, confirmed: event.target.checked })}
            />
            <span>{question.confirmLabel}</span>
          </label>
        ) : null}
      </div>
    );
  }
  const fields = answer?.type === "group" ? answer.fields : {};
  return (
    <div className="space-y-4">
      {question.fields?.map((field) => {
        const current = fields[field.id];
        if (field.type === "boolean") {
          return (
            <label key={field.id} className="flex items-start gap-3 rounded-2xl border border-cream-dark bg-white p-4 text-sm text-charcoal">
              <input type="checkbox" checked={current === true} onChange={(event) => onChange({ type: "group", fields: { ...fields, [field.id]: event.target.checked } })} />
              <span>{field.label}</span>
            </label>
          );
        }
        if (field.type === "textarea") {
          return (
            <label key={field.id} className="block text-sm text-muted">
              {field.label}
              <textarea
                value={typeof current === "string" ? current : ""}
                onChange={(event) => onChange({ type: "group", fields: { ...fields, [field.id]: event.target.value } })}
                className="mt-2 w-full rounded-2xl border border-cream-dark bg-white p-4 text-charcoal outline-none focus:border-bordeaux"
              />
            </label>
          );
        }
        return (
          <label key={field.id} className="block text-sm text-muted">
            {field.label}
            <input
              inputMode={field.type === "number" ? "decimal" : "text"}
              value={current === undefined || current === null ? "" : String(current)}
              onChange={(event) => {
                const raw = event.target.value;
                const value = field.type === "number" ? (raw.trim() ? Number(raw) : null) : raw;
                onChange({ type: "group", fields: { ...fields, [field.id]: value } });
              }}
              className="mt-2 w-full rounded-2xl border border-cream-dark bg-white p-4 text-charcoal outline-none focus:border-bordeaux"
            />
          </label>
        );
      })}
    </div>
  );
}
