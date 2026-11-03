"use client";

import { useState } from "react";

export function ReportDownloads({ reports }: { reports: { id: string; title: string; label: string; pdf: boolean }[] }) {
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");

  async function download(id: string) {
    setPending(id);
    setMessage("");
    const response = await fetch(`/api/account/reports/${id}/pdf`);
    setPending("");
    if (!response.ok) {
      setMessage("PDF татагдсангүй. Дахин оролдоно уу.");
      return;
    }
    const blob = await response.blob();
    const filename = filenameOf(response.headers.get("Content-Disposition")) ?? "naruka-report.pdf";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (reports.length === 0) return <p>Бөглөсөн тайлан алга.</p>;

  return (
    <div className="catalog">
      {reports.map((report) => (
        <article key={report.id} className="report-line">
          <div>
            <span className="row-title">{report.title}</span>
            <span className="row-meta">{report.label}</span>
          </div>
          {report.pdf ? (
            <button type="button" className="btn" disabled={pending === report.id} onClick={() => void download(report.id)}>
              {pending === report.id ? "Бэлдэж байна…" : "PDF татах"}
            </button>
          ) : (
            <span className="row-meta">Төлсний дараа татна</span>
          )}
        </article>
      ))}
      {message ? <p role="alert">{message}</p> : null}
    </div>
  );
}

function filenameOf(header: string | null) {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}
