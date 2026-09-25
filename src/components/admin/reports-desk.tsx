"use client";

import { useState } from "react";
import { formatDay, formatMnt } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { DeskTitle } from "./admin-frame";
import { useDesk, type Desk } from "./desk-context";
import { kindLabel, statusLabel } from "./labels";

type Report = Desk["reports"][number];

export function ReportsDesk() {
  const { desk } = useDesk();
  const [current, setCurrent] = useState<string | null>(null);
  if (!desk) return null;
  const report = desk.reports.find((item) => item.id === current) ?? desk.reports[0] ?? null;

  return (
    <div>
      <DeskTitle
        title="AI тайлан"
        text="Оноо тогтсон дүрмээр гарсан. AI сонгогдсон бүлгийн тайлбарыг бичнэ. Оноо, бүлгийг солихгүй."
      />
      <div className="grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <ul className="grid gap-2">
          {desk.reports.length === 0 ? <li className="text-muted-foreground">Тайлан алга.</li> : null}
          {desk.reports.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`w-full rounded-md border px-3 py-2 text-left ${report?.id === item.id ? "border-primary bg-card" : "border-border bg-card"}`}
                onClick={() => setCurrent(item.id)}
              >
                <span className="block">{item.title}</span>
                <span className="text-sm text-muted-foreground">{formatDay(item.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
        {report ? <ReportSheet report={report} job={desk.jobs.find((job) => job.id === report.generationJobId)} /> : null}
      </div>
    </div>
  );
}

function ReportSheet({ report, job }: { report: Report; job: Desk["jobs"][number] | undefined }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant="outline">{kindLabel[report.kind] ?? report.kind}</Badge>
        {job ? <Badge>{statusLabel[job.status] ?? job.status}</Badge> : null}
        {report.priceMnt > 0 ? <Badge variant="secondary">{formatMnt(report.priceMnt)}₮</Badge> : <Badge variant="secondary">Үнэгүй</Badge>}
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium">{report.title}</h2>
      <p className="mt-3 max-w-2xl">{report.body}</p>
      {report.disclaimer ? <p className="mt-3 text-sm text-muted-foreground">{report.disclaimer}</p> : null}
      {report.outline.length ? (
        <ol className="mt-4 list-decimal pl-5 text-sm">
          {report.outline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : null}
      <ReportBody content={report.fullContent} />
      {job?.error ? <p className="mt-3 text-sm text-destructive">{job.error}</p> : null}
      {job?.model ? <p className="mt-2 text-sm text-muted-foreground">Загвар: {job.model}</p> : null}
    </article>
  );
}

function ReportBody({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return <p className="mt-4 text-sm text-muted-foreground">Бүтэн текст хараахан гараагүй.</p>;
  const body = content as Record<string, unknown>;
  const source = typeof body.source === "string" ? body.source : "";
  return (
    <div className="mt-5 grid gap-4">
      {source ? <p className="text-sm text-muted-foreground">{source === "model" ? "AI бичсэн" : "Загвар текст"}</p> : null}
      {Array.isArray(body.sections)
        ? body.sections.map((section) => {
            const item = section as { heading?: string; body?: string };
            return (
              <section key={item.heading}>
                <h3 className="font-medium">{item.heading}</h3>
                <p>{item.body}</p>
              </section>
            );
          })
        : null}
      {Array.isArray(body.paragraphs) ? body.paragraphs.map((paragraph) => <p key={String(paragraph)}>{String(paragraph)}</p>) : null}
      {Array.isArray(body.directions)
        ? body.directions.map((direction) => {
            const item = direction as { id?: string; why?: string; cuts?: string; colors?: string };
            return (
              <section key={item.id}>
                <h3 className="font-medium">{item.id}</h3>
                <p>{item.why}</p>
                <p className="text-sm text-muted-foreground">{item.cuts}</p>
                <p className="text-sm text-muted-foreground">{item.colors}</p>
              </section>
            );
          })
        : null}
    </div>
  );
}
