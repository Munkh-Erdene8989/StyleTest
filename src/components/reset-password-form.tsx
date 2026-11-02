"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function resetError(code: string) {
  if (code === "weak_password") return "Нууц үг 8-аас 72 тэмдэгтийн хооронд байна.";
  if (code === "code_expired") return "Холбоосын хугацаа дууссан. Шинээр авна уу.";
  if (code === "invalid_code") return "Холбоос буруу байна.";
  return "Нууц үг шинэчлэгдсэнгүй.";
}

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(resetError(String(data.error ?? "")));
        return;
      }
      setDone(true);
    } finally {
      setPending(false);
    }
  }

  if (!token) return <p className="alert">Шинэчлэх холбоос дутуу байна. Имэйл дэх холбоосыг нээнэ үү.</p>;
  if (done) {
    return (
      <p role="status">
        Нууц үг шинэчлэгдлээ. <Link href="/login">Нэвтрэх</Link>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="stack-form">
      <label htmlFor="new-password">
        Шинэ нууц үг
        <input
          id="new-password"
          className="field"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit" className="btn" disabled={pending}>
        Хадгалах
      </button>
      {error ? (
        <p role="alert" className="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
