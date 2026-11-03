"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BODY_FIGURES, GENDERS } from "@/domain/profile";

export function ProfileForm({
  dateOfBirth,
  age,
  gender,
  email,
  phone,
  bodyShape,
  faceShape,
  bodyFigure,
}: {
  dateOfBirth: string;
  age: number | null;
  gender: string;
  email: string;
  phone: string;
  bodyShape: string | null;
  faceShape: string | null;
  bodyFigure: string;
}) {
  const router = useRouter();
  const [dob, setDob] = useState(dateOfBirth);
  const [sex, setSex] = useState(gender);
  const [tel, setTel] = useState(phone);
  const [figure, setFigure] = useState(bodyFigure);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateOfBirth: dob, gender: sex, phone: tel, bodyFigure: figure }),
    });
    setPending(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(messageFor(String(data.error ?? "")));
      return;
    }
    setMessage("Хадгаллаа.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="stack-form">
      <label>
        Нас
        <span className="row-meta">{age === null ? "Төрсөн өдрөө оруулаагүй" : `${age}`}</span>
        <input className="field" type="date" value={dob} onChange={(event) => setDob(event.target.value)} />
      </label>
      <label>
        Хүйс
        <select className="field" value={sex} onChange={(event) => setSex(event.target.value)}>
          <option value="">Сонгоогүй</option>
          {GENDERS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {email ? (
        <p className="profile-fact">
          <span>И-мэйл</span>
          <strong>{email}</strong>
        </p>
      ) : null}
      <label>
        Утас
        <input className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="88112233" value={tel} onChange={(event) => setTel(event.target.value)} />
      </label>
      {bodyShape ? (
        <p className="profile-fact">
          <span>Биеийн хэлбэр</span>
          <strong>{bodyShape}</strong>
        </p>
      ) : null}
      {faceShape ? (
        <p className="profile-fact">
          <span>Нүүрний хэлбэр</span>
          <strong>{faceShape}</strong>
        </p>
      ) : null}
      <label>
        Биеийн хэмжээ төрөл
        <span className="row-meta">Биеийн тестээс автоматаар орно. Эндээс дахин сольж болно.</span>
        <select className="field" value={figure} onChange={(event) => setFigure(event.target.value)}>
          <option value="">Сонгоогүй</option>
          {BODY_FIGURES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Хадгалж байна…" : "Хадгалах"}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}

function messageFor(code: string) {
  if (code === "invalid_age") return "Төрсөн өдрөө зөв оруулна уу.";
  if (code === "invalid_phone") return "Утасны дугаар 8 оронтой байна.";
  if (code === "invalid_gender") return "Хүйсээ сонгоно уу.";
  if (code === "invalid_figure") return "Биеийн хэмжээний төрлөө сонгоно уу.";
  return "Хадгалж чадсангүй.";
}
