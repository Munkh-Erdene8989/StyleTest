"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FinishLoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Нэвтрэлтийг шалгаж байна…");

  useEffect(() => {
    void (async () => {
      const config = await fetch("/api/auth/config").then((response) => response.json());
      if (!config.firebaseConfig) {
        setMessage("Энэ орчинд имэйл холбоос Firebase-ээр дуусаагүй.");
        return;
      }
      const { initializeApp, getApps } = await import("firebase/app");
      const { getAuth, isSignInWithEmailLink, signInWithEmailLink } = await import("firebase/auth");
      const app = getApps()[0] ?? initializeApp(config.firebaseConfig);
      const auth = getAuth(app);
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setMessage("Нэвтрэх холбоос буруу байна.");
        return;
      }
      const email = window.localStorage.getItem("sa_email");
      if (!email) {
        setMessage("И-мэйлээ дахин оруулна уу.");
        return;
      }
      const credential = await signInWithEmailLink(auth, email, window.location.href);
      const token = await credential.user.getIdToken();
      await fetch("/api/auth/claim", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ previousUid: window.sessionStorage.getItem("sa_prev_uid") }),
      });
      setMessage("Нэвтэрлээ.");
      router.push("/account");
      router.refresh();
    })().catch(() => setMessage("Нэвтрэлт амжилтгүй. Дахин оролдоно уу."));
  }, [router]);

  return (
    <main>
      <h1>Нэвтрэлт</h1>
      <p role="status">{message}</p>
    </main>
  );
}
