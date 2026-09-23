"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AgeForm() {
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
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError("Төрсөн өдрөө зөв оруулна уу.");
      return;
    }
    router.refresh();
    return data;
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4">
      <label className="grid gap-1" htmlFor="dob">
        <span className="font-medium">Төрсөн өдөр</span>
        <span className="text-stone-600">Насанд тохирсон тест, төлбөр, зурагтай стайлыг үүгээр ялгана.</span>
        <input
          id="dob"
          type="date"
          required
          value={dateOfBirth}
          onChange={(event) => setDateOfBirth(event.target.value)}
          className="min-h-12 rounded-xl border border-stone-300 px-3"
        />
      </label>
      {error ? (
        <p role="alert" className="text-rose-800">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="min-h-12 rounded-xl bg-teal-800 px-4 font-medium text-white">
        {pending ? "Хадгалж байна…" : "Үргэлжлүүлэх"}
      </button>
    </form>
  );
}
