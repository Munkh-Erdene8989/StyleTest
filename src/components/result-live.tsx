"use client";

import { useEffect, useState } from "react";
import { formatDay, formatMnt } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShareCard } from "./share-card";

type View = {
  reportId: string;
  sessionId: string;
  kind: string;
  demo: boolean;
  summary: { title: string; body: string; disclaimer?: string };
  outline: string[];
  priceMnt: number;
  jobStatus: string | null;
  entitlementStatus: string;
  fullContent?: unknown;
  assets?: { url: string }[];
  helpContacts: { name: string; phone: string; note: string; source: string }[];
  expiresAt?: string;
};

export function ResultLive({ initial, appName, email }: { initial: View; appName: string; email: string | null }) {
  const [view, setView] = useState(initial);

  const waiting = view.jobStatus === "pending" || view.jobStatus === "processing" || view.entitlementStatus === "unlocking";

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/sessions/${view.sessionId}/result`);
      if (response.ok) setView(await response.json());
    }, 2500);
    return () => window.clearInterval(timer);
  }, [waiting, view.sessionId]);

  const unpaid = view.entitlementStatus === "locked";
  const shown = sections(view.fullContent);
  const briefReady = view.kind !== "personality" || shown.length > 0;
  const showPay = unpaid && view.priceMnt > 0 && briefReady;

  return (
    <article className="stack-form">
      {view.demo ? <p className="banner">Үзүүлэх агуулга. Баталгаажсан аргачлал биш.</p> : null}
      <h1>{view.summary.title}</h1>
      <p>{view.summary.body}</p>
      {view.summary.disclaimer ? <p className="note">{view.summary.disclaimer}</p> : null}
      {view.kind === "stress" ? <Help contacts={view.helpContacts} /> : null}
      {view.jobStatus === "pending" || view.jobStatus === "processing" ? (
        <p role="status">{unpaid ? "Товч тайлан бэлтгэгдэж байна." : "Боловсруулж байна. Төлбөр баталгаажсан ч дуусаагүй бол бэлэн болмогц нээгдэнэ."}</p>
      ) : null}
      {view.jobStatus === "failed" ? <p role="alert">Боловсруулалт амжилтгүй. Техникийн дахин оролдлого шинэ төлбөр биш.</p> : null}
      {view.entitlementStatus === "unlocking" ? <p>Төлбөр баталгаажсан. Тайлан бэлтгэгдэж байна.</p> : null}
      {unpaid && shown.length > 0 ? <h2>Товч тайлан</h2> : null}
      {paragraphs(view.fullContent).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {shown.map((section) => (
        <section key={section.heading}>
          <h2 className="font-medium">{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      {showPay ? (
        <section className="pay">
          <h2>Дэлгэрэнгүй тайлан</h2>
          <p>Товч тайлан нийт агуулгын 60%. Үлдсэн 40% төлбөр төлсний дараа нээгдэнэ.</p>
          <ul className="list-disc pl-5">
            {view.outline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="price">{formatMnt(view.priceMnt)}₮</p>
          {view.expiresAt ? <p>Төлөгдөөгүй дэлгэрэнгүй хэсэг {formatDay(view.expiresAt)} хүртэл хадгалагдана.</p> : null}
          {email ? (
            <BuyButton sessionId={view.sessionId} product={view.kind === "style_package" ? "style_package" : "personality_report"} />
          ) : (
            <Link className="inline-link" href="/login">
              Төлбөр төлөхийн өмнө нэвтэрнэ үү
            </Link>
          )}
        </section>
      ) : null}
      {view.assets?.map((asset) => (
        <img key={asset.url} src={asset.url} alt="Стайлын дүрслэл" className="frame" />
      ))}
      {view.kind === "fun" ? <ShareCard title={view.summary.title} appName={appName} /> : null}
      {view.entitlementStatus === "active" ? (
        <button
          type="button"
          className="btn-quiet"
          onClick={() => void fetch(`/api/reports/${view.reportId}/used`, { method: "POST" })}
        >
          Зөвлөмж ашигласан
        </button>
      ) : null}
    </article>
  );
}

function BuyButton({ sessionId, product }: { sessionId: string; product: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function buy() {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, productCode: product }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError("Төлбөрийн нэхэмжлэл үүссэнгүй.");
      return;
    }
    router.push(`/checkout/${data.id}`);
  }
  return (
    <>
      <button type="button" onClick={() => void buy()} className="btn">
        Дэлгэрэнгүй тайлан үзэх
      </button>
      {error ? <p role="alert" className="alert">{error}</p> : null}
    </>
  );
}

function paragraphs(content: unknown) {
  if (!content || typeof content !== "object" || !("paragraphs" in content)) return [];
  const value = (content as { paragraphs?: unknown }).paragraphs;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sections(content: unknown) {
  if (!content || typeof content !== "object" || !("sections" in content)) return [];
  const value = (content as { sections?: unknown }).sections;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { heading: string; body: string } => {
    return Boolean(item && typeof item === "object" && "heading" in item && "body" in item);
  });
}

function Help({ contacts }: { contacts: View["helpContacts"] }) {
  return (
    <section className="help">
      <h2>Тусламж</h2>
      {contacts.length === 0 ? (
        <p>Тусламжийн холбоо барих мэдээллийг баталгаатай эх сурвалжаар оруулаагүй байна.</p>
      ) : (
        <ul>
          {contacts.map((contact) => (
            <li key={contact.phone}>
              {contact.name}: {contact.phone}. {contact.note} Эх сурвалж: {contact.source}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
