"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function loginError(code: string, step: "email" | "code") {
  if (code === "rate_limited") return "Хэт олон удаа илгээлээ. Түр хүлээнэ үү.";
  if (code === "invalid_code") return "Код буруу байна.";
  if (code === "code_expired") return "Кодын хугацаа дууссан. Дахин авна уу.";
  if (code === "too_many_attempts") return "Оролдлого хэтэрсэн. Дахин код авна уу.";
  if (step === "email") return "И-мэйл хаягаа шалгана уу.";
  return "Код буруу байна.";
}

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function sendCode() {
    setError("");
    setPending(true);
    try {
      await fetch("/api/auth/guest", { method: "POST" });
      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(loginError(String(data.error ?? ""), "email"));
        return;
      }
      setStep("code");
      setMessage(
        data.development && data.code
          ? `Хөгжүүлэлтийн код: ${data.code}. Имэйл илгээгдээгүй.`
          : "Нэг удаагийн баталгаажуулах кодыг и-мэйлээр илгээлээ.",
      );
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(loginError(String(data.error ?? ""), "code"));
        return;
      }
      setMessage("Нэвтэрлээ.");
      router.push("/account");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="stack-form">
        <label htmlFor="code">
          Баталгаажуулах код
          <input
            id="code"
            className="field"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </label>
        <button type="submit" className="btn" disabled={pending}>
          Баталгаажуулах
        </button>
        <button
          type="button"
          className="btn-quiet"
          disabled={pending}
          onClick={() => {
            setCode("");
            setError("");
            void sendCode();
          }}
        >
          Код дахин авах
        </button>
        <button
          type="button"
          className="btn-quiet"
          disabled={pending}
          onClick={() => {
            setStep("email");
            setCode("");
            setError("");
            setMessage("");
          }}
        >
          И-мэйл солих
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void sendCode();
      }}
      className="stack-form"
    >
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
      <button type="submit" className="btn" disabled={pending}>
        Код авах
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
