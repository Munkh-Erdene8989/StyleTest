"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    await fetch("/api/auth/guest", { method: "POST" });
    const response = await fetch("/api/auth/email-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError("И-мэйл хаягаа шалгана уу.");
      return;
    }
    if (data.development) {
      setMessage("Хөгжүүлэлтийн орчинд нэвтэрлээ.");
      router.refresh();
      return;
    }
    window.sessionStorage.setItem("sa_prev_uid", data.userId);
    window.localStorage.setItem("sa_email", email);
    setMessage("Нэвтрэх холбоосыг и-мэйлээр илгээлээ.");
  }

  return (
    <form onSubmit={submit} className="stack-form">
      <label htmlFor="email">
        И-мэйл
        <input
          id="email"
          className="field"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <button type="submit" className="btn">
        Нэвтрэх холбоос авах
      </button>
      {message ? <p role="status">{message}</p> : null}
      {error ? (
        <p role="alert" className="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
