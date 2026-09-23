"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Example = { id: string; title: string; paletteFamily: string };

export function StyleWizard({
  sessionId,
  examples,
  personalitySessionId,
}: {
  sessionId: string;
  examples: Example[];
  personalitySessionId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [aspire, setAspire] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<"office" | "home" | "mixed">("mixed");
  const [comfort, setComfort] = useState("");
  const [request, setRequest] = useState("");
  const [usePersonality, setUsePersonality] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function toggle(list: string[], id: string, setList: (value: string[]) => void) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id].slice(0, 6));
  }

  async function saveInput() {
    const response = await fetch(`/api/style/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        likedIds: liked,
        aspireIds: aspire,
        dislikedIds: disliked,
        lifestyle,
        comfort,
        request,
        usePersonality,
        personalitySessionId: usePersonality ? personalitySessionId : undefined,
      }),
    });
    if (!response.ok) throw new Error("save");
  }

  async function upload(role: "face" | "body", file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("role", role);
    form.set("sessionId", sessionId);
    form.set("consent", String(consent));
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    if (!response.ok) throw new Error("upload");
  }

  async function finish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const face = form.get("face");
      const body = form.get("body");
      if (!(face instanceof File) || !(body instanceof File) || !consent) throw new Error("upload");
      await saveInput();
      await upload("face", face);
      await upload("body", body);
      const response = await fetch(`/api/style/sessions/${sessionId}/complete`, { method: "POST" });
      if (!response.ok) throw new Error("complete");
      router.push(`/sessions/${sessionId}`);
    } catch {
      setPending(false);
      setError("Зураг, зөвшөөрөл, дуртай жишээгээ шалгаад дахин оролдоно уу.");
    }
  }

  return (
    <div className="grid gap-4">
      <p>
        Алхам {step + 1} / 3
      </p>
      {step === 0 ? (
        <section className="grid gap-4">
          <Picker title="Дуртай" examples={examples} selected={liked} onToggle={(id) => toggle(liked, id, setLiked)} />
          <Picker title="Өмсөж үзмээр" examples={examples} selected={aspire} onToggle={(id) => toggle(aspire, id, setAspire)} />
          <Picker title="Таалагддаггүй" examples={examples} selected={disliked} onToggle={(id) => toggle(disliked, id, setDisliked)} />
          <button type="button" className="min-h-12 rounded-xl bg-teal-800 text-white" onClick={() => setStep(1)}>
            Үргэлжлүүлэх
          </button>
        </section>
      ) : null}
      {step === 1 ? (
        <section className="grid gap-3">
          <label className="grid gap-1">
            Амьдралын хэв маяг
            <select className="min-h-12 rounded-xl border border-stone-300 px-3" value={lifestyle} onChange={(event) => setLifestyle(event.target.value as "office" | "home" | "mixed")}>
              <option value="mixed">Холимог</option>
              <option value="office">Ажил, нямбай</option>
              <option value="home">Гэр, тухтай</option>
            </select>
          </label>
          <label className="grid gap-1">
            Тухтай санагддаг хувцас
            <textarea className="min-h-24 rounded-xl border border-stone-300 p-3" value={comfort} onChange={(event) => setComfort(event.target.value)} maxLength={400} />
          </label>
          <label className="grid gap-1">
            Хүсэлт
            <textarea className="min-h-24 rounded-xl border border-stone-300 p-3" value={request} onChange={(event) => setRequest(event.target.value)} maxLength={400} />
          </label>
          {personalitySessionId ? (
            <label className="flex gap-2">
              <input type="checkbox" checked={usePersonality} onChange={(event) => setUsePersonality(event.target.checked)} />
              Зан төлөвийн тестийн үр дүнг тусад нь зөвшөөрч ашиглах
            </label>
          ) : null}
          <button type="button" className="min-h-12 rounded-xl bg-teal-800 text-white" onClick={() => void saveInput().then(() => setStep(2)).catch(() => setError("Сонголтоо шалгана уу."))}>
            Үргэлжлүүлэх
          </button>
        </section>
      ) : null}
      {step === 2 ? (
        <form onSubmit={finish} className="grid gap-3">
          <p>Нүүр тод, гэрэл жигд, бүтэн бие хувцастай, хэт тайралтгүй зураг оруулна уу. Зөвхөн өөрийн зураг.</p>
          <label className="flex gap-2">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            Өөрийн зургийг стайлын дүрслэлд ашиглахыг зөвшөөрч байна
          </label>
          <label className="grid gap-1">
            Нүүрний зураг
            <input name="face" type="file" accept="image/png,image/jpeg,image/webp" required />
          </label>
          <label className="grid gap-1">
            Бүтэн биеийн зураг
            <input name="body" type="file" accept="image/png,image/jpeg,image/webp" required />
          </label>
          <button type="submit" disabled={pending} className="min-h-12 rounded-xl bg-teal-800 text-white">
            {pending ? "Боловсруулж байна…" : "Дуусгах"}
          </button>
        </form>
      ) : null}
      {error ? (
        <p role="alert" className="text-rose-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Picker({
  title,
  examples,
  selected,
  onToggle,
}: {
  title: string;
  examples: Example[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="font-medium">{title}</legend>
      <div className="grid grid-cols-2 gap-2">
        {examples.map((example) => (
          <button
            type="button"
            key={example.id}
            aria-pressed={selected.includes(example.id)}
            onClick={() => onToggle(example.id)}
            className={`min-h-16 rounded-xl border px-2 text-left ${selected.includes(example.id) ? "border-teal-800 bg-teal-50" : "border-stone-200 bg-white"}`}
          >
            <span className={`mb-1 block h-3 rounded ${swatch(example.paletteFamily)}`} />
            {example.title}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function swatch(palette: string) {
  if (palette === "warm") return "bg-orange-200";
  if (palette === "contrast") return "bg-stone-800";
  if (palette === "earth") return "bg-amber-700";
  return "bg-stone-300";
}
