"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ContinueAsAdult() {
  const router = useRouter();
  const [note, setNote] = useState("Үргэлжилж байна…");

  useEffect(() => {
    let gone = false;
    void (async () => {
      await fetch("/api/auth/guest", { method: "POST" });
      const response = await fetch("/api/profile/adult", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { ageBand?: string };
      if (gone) return;
      if (response.ok && data.ageBand === "adult") {
        router.refresh();
        return;
      }
      setNote("Зурагтай стайлын үйлчилгээ 18-аас дээш насныханд нээлттэй.");
    })();
    return () => {
      gone = true;
    };
  }, [router]);

  return <p>{note}</p>;
}
