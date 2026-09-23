"use client";

import { useEffect } from "react";

export function AuthBootstrap() {
  useEffect(() => {
    void fetch("/api/auth/guest", { method: "POST" });
  }, []);
  return null;
}
