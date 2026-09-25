"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isHeic } from "@/domain/images";

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
    if (!response.ok) throw new Error(await errorCode(response));
  }

  async function upload(role: "face" | "body", file: File) {
    const form = new FormData();
    form.set("file", await prepareImage(file));
    form.set("role", role);
    form.set("sessionId", sessionId);
    form.set("consent", String(consent));
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    if (!response.ok) throw new Error(await errorCode(response));
  }

  async function finish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const face = form.get("face");
      const body = form.get("body");
      if (!consent) throw new Error("consent_required");
      if (!(face instanceof File) || face.size === 0 || !(body instanceof File) || body.size === 0) {
        throw new Error("invalid_image");
      }
      await saveInput();
      await upload("face", face);
      await upload("body", body);
      const response = await fetch(`/api/style/sessions/${sessionId}/complete`, { method: "POST" });
      if (!response.ok) throw new Error(await errorCode(response));
      router.push(`/sessions/${sessionId}`);
    } catch (error) {
      setPending(false);
      setError(messageFor(error instanceof Error ? error.message : ""));
    }
  }

  return (
    <div className="stack-form">
      <p className="row-meta">Алхам {step + 1} / 3</p>
      {step === 0 ? (
        <section className="stack-form">
          <Picker title="Дуртай" examples={examples} selected={liked} onToggle={(id) => toggle(liked, id, setLiked)} />
          <Picker title="Өмсөж үзмээр" examples={examples} selected={aspire} onToggle={(id) => toggle(aspire, id, setAspire)} />
          <Picker title="Таалагддаггүй" examples={examples} selected={disliked} onToggle={(id) => toggle(disliked, id, setDisliked)} />
          <button type="button" className="btn" onClick={() => setStep(1)}>
            Үргэлжлүүлэх
          </button>
        </section>
      ) : null}
      {step === 1 ? (
        <section className="stack-form">
          <label>
            Амьдралын хэв маяг
            <select className="field" value={lifestyle} onChange={(event) => setLifestyle(event.target.value as "office" | "home" | "mixed")}>
              <option value="mixed">Холимог</option>
              <option value="office">Ажил, нямбай</option>
              <option value="home">Гэр, тухтай</option>
            </select>
          </label>
          <label>
            Тухтай санагддаг хувцас
            <textarea className="field" value={comfort} onChange={(event) => setComfort(event.target.value)} maxLength={400} />
          </label>
          <label>
            Хүсэлт
            <textarea className="field" value={request} onChange={(event) => setRequest(event.target.value)} maxLength={400} />
          </label>
          {personalitySessionId ? (
            <label className="check">
              <input type="checkbox" checked={usePersonality} onChange={(event) => setUsePersonality(event.target.checked)} />
              Зан төлөвийн тестийн үр дүнг тусад нь зөвшөөрч ашиглах
            </label>
          ) : null}
          <button type="button" className="btn" onClick={() => void saveInput().then(() => setStep(2)).catch(() => setError("Сонголтоо шалгана уу."))}>
            Үргэлжлүүлэх
          </button>
        </section>
      ) : null}
      {step === 2 ? (
        <form onSubmit={finish} className="stack-form">
          <p>Нүүр тод, гэрэл жигд, бүтэн бие хувцастай, хэт тайралтгүй зураг оруулна уу. PNG, JPEG, WEBP болон iPhone-ийн HEIC зураг авна. Зөвхөн өөрийн зураг.</p>
          <label className="check">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            Өөрийн зургийг стайлын дүрслэлд ашиглахыг зөвшөөрч байна
          </label>
          <label>
            Нүүрний зураг
            <input className="field" name="face" type="file" accept={PHOTO_ACCEPT} required />
          </label>
          <label>
            Бүтэн биеийн зураг
            <input className="field" name="body" type="file" accept={PHOTO_ACCEPT} required />
          </label>
          <button type="submit" disabled={pending} className="btn">
            {pending ? "Боловсруулж байна…" : "Дуусгах"}
          </button>
        </form>
      ) : null}
      {error ? (
        <p role="alert" className="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

async function errorCode(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || "server_error";
}

function messageFor(code: string) {
  if (code === "consent_required") return "Зургийн зөвшөөрлөө тэмдэглэнэ үү.";
  if (code === "invalid_image") return "PNG, JPEG, WEBP эсвэл iPhone-ийн HEIC зураг оруулна уу.";
  if (code === "file_too_large") return "Зураг хэт том байна. Бага хэмжээтэй зураг сонгоно уу.";
  if (code === "preference_required") return "Дуртай эсвэл өмсөж үзмээр жишээнээс нэгийг сонгоно уу.";
  if (code === "not_enough_directions") return "Сонголтоо өөрчилж дахин оролдоно уу.";
  if (code === "server_error") return "Зураг хадгалахад алдаа гарлаа. Дахин оролдоно уу.";
  return "Зураг, зөвшөөрөл, дуртай жишээгээ шалгаад дахин оролдоно уу.";
}

const PHOTO_ACCEPT = "image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif";

async function prepareImage(file: File) {
  const source = isHeic(file.type, file.name) ? await convertHeic(file) : file;
  if (source.size <= 1_500_000 && source.type === "image/jpeg") return source;
  try {
    const bitmap = await createImageBitmap(source);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return source;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return source;
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    if (source.type === "image/jpeg" || source.type === "image/png" || source.type === "image/webp") return source;
    throw new Error("invalid_image");
  }
}

async function convertHeic(file: File) {
  try {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.82 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!blob) throw new Error("invalid_image");
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_image") throw error;
    throw new Error("invalid_image");
  }
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
    <fieldset className="stack-form">
      <legend className="row-title">{title}</legend>
      <div className="picks">
        {examples.map((example) => (
          <button
            type="button"
            key={example.id}
            aria-pressed={selected.includes(example.id)}
            onClick={() => onToggle(example.id)}
            className="pick"
          >
            <span className={`fabric fabric-${example.paletteFamily}`} />
            {example.title}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
