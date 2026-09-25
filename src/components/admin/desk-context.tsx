"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CatalogTest, TestDraft } from "@/domain/admin-content";
import type { NewsPost } from "@/domain/news";

export type Desk = {
  viewer: { id: string; email: string | null; role: string; canReadSensitive: boolean };
  appName: string;
  helpContacts: { name: string; phone: string; note: string; source: string }[];
  funCopy: Record<string, { title: string; summary: string }>;
  tests: CatalogTest[];
  news: NewsPost[];
  users: { id: string; email: string | null; ageBand: string; anonymous: boolean; role: string; createdAt: string }[];
  sessions: {
    id: string;
    ownerUid: string;
    kind: string;
    testId: string;
    versionId: string;
    status: string;
    answerCount: number;
    styleReady: boolean;
    createdAt: string;
    score: { raw: number; bandId: string } | null;
  }[];
  reports: {
    id: string;
    sessionId: string;
    ownerUid: string;
    versionId: string;
    kind: string;
    title: string;
    body: string;
    disclaimer: string;
    outline: string[];
    fullContent: unknown;
    priceMnt: number;
    generationJobId: string | null;
    createdAt: string;
  }[];
  orders: {
    id: string;
    ownerUid: string;
    productCode: string;
    amount: number;
    currency: string;
    paymentStatus: string;
    channel: string;
    sessionId: string;
    reportId: string;
    paidAt: string | null;
    createdAt: string;
  }[];
  jobs: {
    id: string;
    sessionId: string;
    kind: string;
    status: string;
    attempt: number;
    maxAttempts: number;
    costUsd: number;
    error: string | null;
    model: string | null;
    createdAt: string;
  }[];
  refunds: { id: string; orderId: string; ownerUid: string; reason: string; status: string; requestedAt: string }[];
  events: { name: string; product: string | null; createdAt: string }[];
  ledger: { id: string; type: string; amountMnt?: number; costUsd?: number; createdAt: string }[];
  audit: { id: string; actorId: string; role: string; action: string; target: string; reason: string; createdAt: string }[];
};

type DeskState = {
  desk: Desk | null;
  error: string;
  reload: () => Promise<void>;
};

const DeskContext = createContext<DeskState | null>(null);

export function DeskProvider({ children }: { children: React.ReactNode }) {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const response = await fetch("/api/admin/desk");
    if (!response.ok) {
      setError("Админ эрх алга.");
      setDesk(null);
      return;
    }
    setError("");
    setDesk((await response.json()) as Desk);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return <DeskContext.Provider value={{ desk, error, reload }}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const value = useContext(DeskContext);
  if (!value) throw new Error("desk_missing");
  return value;
}

export type { TestDraft };
