"use client";

import { useState } from "react";
import { formatDay } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeskTitle } from "./admin-frame";
import { useDesk, type Desk } from "./desk-context";
import { kindLabel, statusLabel } from "./labels";

type SessionRow = Desk["sessions"][number];

export function ResponsesDesk() {
  const { desk } = useDesk();
  const [open, setOpen] = useState<SessionRow | null>(null);
  if (!desk) return null;
  const name = (versionId: string) => desk.tests.find((test) => test.version.id === versionId)?.version.title ?? versionId;
  const email = (uid: string) => desk.users.find((user) => user.id === uid)?.email || "Зочин";

  return (
    <div>
      <DeskTitle title="Хариулт" text="Оноо, бүлэг энд харагдана. Асуултын хариулт мэдрэмтгий тул шалтгаан бичиж нээнэ." />
      {desk.sessions.length === 0 ? <p className="text-muted-foreground">Хариулт алга.</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Асуулга</TableHead>
            <TableHead>Хүн</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead>Оноо</TableHead>
            <TableHead>Огноо</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {desk.sessions.map((session) => (
            <TableRow key={session.id} className="cursor-pointer" onClick={() => setOpen(session)}>
              <TableCell>{session.kind === "style" ? "Стайл студи" : name(session.versionId)}</TableCell>
              <TableCell>{email(session.ownerUid)}</TableCell>
              <TableCell>{statusLabel[session.status] ?? session.status}</TableCell>
              <TableCell>{session.score ? `${session.score.raw} · ${session.score.bandId}` : session.styleReady ? "Сонголттой" : "—"}</TableCell>
              <TableCell>{formatDay(session.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AnswerDialog session={open} desk={desk} onClose={() => setOpen(null)} />
    </div>
  );
}

function AnswerDialog({ session, desk, onClose }: { session: SessionRow | null; desk: Desk; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [pairs, setPairs] = useState<{ question: string; answer: string }[]>([]);
  const [note, setNote] = useState("");
  const test = desk.tests.find((item) => item.version.id === session?.versionId);

  async function reveal() {
    if (!session) return;
    setNote("");
    const response = await fetch("/api/admin/sensitive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: `session:${session.id}`, reason }),
    });
    const json = (await response.json()) as { answers?: Record<string, string>; error?: string; styleInput?: { request?: string; comfort?: string; lifestyle?: string } | null };
    if (!response.ok) {
      setNote(json.error === "forbidden" ? "Мэдрэмтгий эрх хэрэгтэй." : "Шалтгаан 8-аас доошгүй тэмдэгт, эсвэл сесс олдсонгүй.");
      return;
    }
    if (session.kind === "style") {
      const style = json.styleInput;
      setPairs([
        { question: "Амьдралын хэв маяг", answer: style?.lifestyle || "—" },
        { question: "Тух", answer: style?.comfort || "—" },
        { question: "Хүсэлт", answer: style?.request || "—" },
      ]);
      return;
    }
    const answers = json.answers ?? {};
    setPairs(
      (test?.version.questions ?? []).map((question) => ({
        question: question.text,
        answer: question.options.find((option) => option.id === answers[question.id])?.label || "—",
      })),
    );
  }

  return (
    <Dialog open={Boolean(session)} onOpenChange={(next) => { if (!next) { onClose(); setPairs([]); setNote(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session ? (session.kind === "style" ? "Стайл студи" : test?.version.title ?? "Хариулт") : "Хариулт"}</DialogTitle>
        </DialogHeader>
        {session?.score ? (
          <p>
            Нийлбэр оноо {session.score.raw}. Бүлэг: {test?.version.bands.find((band) => band.id === session.score?.bandId)?.title ?? session.score.bandId}.
          </p>
        ) : null}
        {desk.viewer.canReadSensitive ? (
          <div className="grid gap-2">
            <Input value={reason} placeholder="Яагаад нээж байгаа вэ" onChange={(event) => setReason(event.target.value)} />
            <Button type="button" onClick={() => void reveal()}>
              Хариултыг нээх
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Асуултын хариулт мэдрэмтгий эрхтэй үед, шалтгаантайгаар нээгдэнэ. Оноо энд харагдана.</p>
        )}
        {note ? <p className="text-sm">{note}</p> : null}
        <ul className="grid gap-3">
          {pairs.map((pair) => (
            <li key={pair.question}>
              <p className="text-sm text-muted-foreground">{pair.question}</p>
              <p>{pair.answer}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{session ? kindLabel[session.kind] : ""}</p>
      </DialogContent>
    </Dialog>
  );
}
