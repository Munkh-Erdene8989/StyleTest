"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid gap-3">
      <h1>Алдаа гарлаа</h1>
      <p>Хуудсыг дахин ачаална уу.</p>
      <button type="button" onClick={reset} className="btn">
        Дахин ачаалах
      </button>
    </main>
  );
}
