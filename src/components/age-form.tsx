"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AgeForm({ next }: { next?: string }) {
  const router = useRouter();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    await fetch("/api/auth/guest", { method: "POST" });
    const response = await fetch("/api/profile/age", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateOfBirth }),
    });
    setPending(false);
    if (!response.ok) {
      setError("Төрсөн өдрөө зөв оруулна уу.");
      return;
    }
    if (next) router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="stack-form">
      <label htmlFor="dob">
        <span className="row-title">Төрсөн өдөр</span>
        <span className="row-meta">Насанд тохирсон тест, төлбөр, зурагтай стайлыг үүгээр ялгана.</span>
        <input id="dob" className="field" type="date" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
      </label>
      {error ? (
        <p role="alert" className="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Хадгалж байна…" : "Үргэлжлүүлэх"}
      </button>
    </form>
  );
}
