"use client";

import { useState } from "react";
import { formatDay } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";
import { eventLabel, kindLabel, statusLabel } from "./labels";

export function RefundsDesk() {
  const { desk, reload } = useDesk();
  if (!desk) return null;
  async function decide(refundId: string, action: "approve" | "reject" | "manual") {
    await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "manual" ? { action: "manual", refundId } : { decision: action, refundId }),
    });
    await reload();
  }
  return (
    <div>
      <DeskTitle title="Буцаалт" text="Хүсэлтийг зөвшөөрөх, татгалзах, эсвэл гараар буцаасан гэж тэмдэглэнэ." />
      {desk.refunds.length === 0 ? <p className="text-muted-foreground">Хүсэлт алга.</p> : null}
      <div className="grid gap-3">
        {desk.refunds.map((refund) => (
          <article key={refund.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-medium">{statusLabel[refund.status] ?? refund.status}</p>
            <p className="mt-1">{refund.reason}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatDay(refund.requestedAt)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void decide(refund.id, "approve")}>
                Зөвшөөрөх
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void decide(refund.id, "reject")}>
                Татгалзах
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => void decide(refund.id, "manual")}>
                Гараар буцаасан
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function JobsDesk() {
  const { desk, reload } = useDesk();
  if (!desk) return null;
  return (
    <div>
      <DeskTitle title="Үүсгэлт" text="AI тайлан, стайл зургийн ажил. Алдаатайг дахин оруулна. Төлбөртэй ажлын өртөг тусдаа бүртгэгдэнэ." />
      {desk.jobs.length === 0 ? <p className="text-muted-foreground">Ажил алга.</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Төрөл</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead>Оролдлого</TableHead>
            <TableHead>Өртөг</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {desk.jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.kind}</TableCell>
              <TableCell>
                {statusLabel[job.status] ?? job.status}
                {job.error ? ` · ${job.error}` : ""}
              </TableCell>
              <TableCell>
                {job.attempt}/{job.maxAttempts}
              </TableCell>
              <TableCell>${job.costUsd}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void fetch("/api/admin/jobs/retry", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ jobId: job.id }),
                    }).then(reload)
                  }
                >
                  Дахин
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function StyleDesk() {
  const { desk } = useDesk();
  if (!desk) return null;
  const sessions = desk.sessions.filter((session) => session.kind === "style");
  return (
    <div>
      <DeskTitle title="Стайл студи" text="Гурван алхам: жишээ сонгох, амьдралын хэв маяг, зураг. Чиглэлийг дүрэм эрэмбэлнэ. AI тайлбар бичнэ." />
      {sessions.length === 0 ? <p className="text-muted-foreground">Стайл сесс алга.</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Төлөв</TableHead>
            <TableHead>Сонголт</TableHead>
            <TableHead>Огноо</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>{statusLabel[session.status] ?? session.status}</TableCell>
              <TableCell>{session.styleReady ? "Бөглөсөн" : "Дутуу"}</TableCell>
              <TableCell>{formatDay(session.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SettingsDesk() {
  const { desk, reload } = useDesk();
  const [name, setName] = useState(desk?.appName ?? "");
  const [contacts, setContacts] = useState(desk?.helpContacts ?? []);
  const [message, setMessage] = useState("");
  if (!desk) return null;
  return (
    <div className="max-w-xl">
      <DeskTitle title="Тохиргоо" text="Сайтын нэр, стрессийн үр дүнд гарах тусламжийн холбоо." />
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const response = await fetch("/api/admin/site", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appName: name, helpContacts: contacts }),
          });
          setMessage(response.ok ? "Хадгаллаа." : "Хадгалж чадсангүй.");
          if (response.ok) await reload();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="app-name">Сайтын нэр</Label>
          <Input id="app-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="grid gap-3">
          {contacts.map((contact, index) => (
            <div key={index} className="grid gap-2 rounded-md border border-border p-3">
              <Input value={contact.name} placeholder="Нэр" onChange={(event) => setContacts(contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)))} />
              <Input value={contact.phone} placeholder="Утас" onChange={(event) => setContacts(contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, phone: event.target.value } : item)))} />
              <Input value={contact.note} placeholder="Тэмдэглэл" onChange={(event) => setContacts(contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, note: event.target.value } : item)))} />
              <Input value={contact.source} placeholder="Эх сурвалж" onChange={(event) => setContacts(contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, source: event.target.value } : item)))} />
              <Button type="button" variant="ghost" onClick={() => setContacts(contacts.filter((_, itemIndex) => itemIndex !== index))}>
                Хасах
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setContacts([...contacts, { name: "", phone: "", note: "", source: "" }])}>
            Холбоо нэмэх
          </Button>
        </div>
        <Button type="submit">Хадгалах</Button>
        {message ? <p>{message}</p> : null}
      </form>
    </div>
  );
}

export function AuditDesk() {
  const { desk } = useDesk();
  if (!desk) return null;
  return (
    <div>
      <DeskTitle title="Аудит" text="Админы үйлдэл, мэдрэмтгий хандалтын шалтгаан." />
      {desk.audit.length === 0 ? <p className="text-muted-foreground">Бичилт алга.</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Үйлдэл</TableHead>
            <TableHead>Оноо</TableHead>
            <TableHead>Шалтгаан</TableHead>
            <TableHead>Огноо</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {desk.audit.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.target}</TableCell>
              <TableCell>{log.reason || "—"}</TableCell>
              <TableCell>{formatDay(log.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <h2 className="mb-3 mt-8 font-medium">Үйл явдал</h2>
      <ul>
        {desk.events.map((event, index) => (
          <li key={`${event.name}-${index}`} className="border-b border-border py-2 text-sm">
            {eventLabel[event.name] ?? event.name}
            {event.product ? ` · ${kindLabel[event.product] ?? event.product}` : ""} · {formatDay(event.createdAt)}
          </li>
        ))}
      </ul>
    </div>
  );
}
