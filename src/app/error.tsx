"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid gap-3">
      <h1 className="text-2xl font-semibold">Алдаа гарлаа</h1>
      <p>Хуудсыг дахин ачаална уу.</p>
      <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-teal-800 text-white">
        Дахин ачаалах
      </button>
    </main>
  );
}
