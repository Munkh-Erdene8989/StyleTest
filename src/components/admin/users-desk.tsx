"use client";

import { Fragment, useEffect, useState } from "react";
import { formatDay } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";
import { roleLabel } from "./labels";

export function UsersDesk() {
  const { desk } = useDesk();
  if (!desk) return null;
  const registered = desk.users.filter((user) => user.email && !user.anonymous);
  const guests = desk.users.filter((user) => !user.email || user.anonymous);
  return (
    <div>
      <DeskTitle title="Хэрэглэгч" text={`${registered.length} бүртгэлтэй, ${guests.length} зочин.`} />
      <Tabs defaultValue="registered">
        <TabsList>
          <TabsTrigger value="registered">Бүртгэлтэй</TabsTrigger>
          <TabsTrigger value="guests">Зочин</TabsTrigger>
        </TabsList>
        <TabsContent value="registered">
          <UserTable rows={registered} />
        </TabsContent>
        <TabsContent value="guests">
          <UserTable rows={guests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserTable({ rows }: { rows: { id: string; email: string | null; ageBand: string; role: string; createdAt: string }[] }) {
  const [openId, setOpenId] = useState("");
  if (rows.length === 0) return <p className="text-muted-foreground">Хүн алга.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Имэйл</TableHead>
          <TableHead>Нас</TableHead>
          <TableHead>Эрх</TableHead>
          <TableHead>Бүртгэсэн</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((user) => (
          <Fragment key={user.id}>
            <TableRow className="cursor-pointer" onClick={() => setOpenId(openId === user.id ? "" : user.id)}>
              <TableCell>{user.email || "—"}</TableCell>
              <TableCell>{user.ageBand === "adult" ? "Насанд хүрсэн" : user.ageBand === "under18" ? "18-аас доош" : "Ороогүй"}</TableCell>
              <TableCell>{roleLabel[user.role] ?? user.role}</TableCell>
              <TableCell>{formatDay(user.createdAt)}</TableCell>
            </TableRow>
            {openId === user.id ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <UserAnswers id={user.id} />
                </TableCell>
              </TableRow>
            ) : null}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

function UserAnswers({ id }: { id: string }) {
  const [tests, setTests] = useState<{ id: string; title: string; createdAt: string; answers: { question: string; answer: string }[] }[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch(`/api/admin/users/${id}`)
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setError("Хариулт нээгдсэнгүй.");
          return;
        }
        const json = await response.json();
        setTests(json.tests ?? []);
      })
      .catch(() => {
        if (active) setError("Хариулт нээгдсэнгүй.");
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error) return <p className="text-sm text-muted-foreground">{error}</p>;
  if (!tests) return <p className="text-sm text-muted-foreground">Ачаалж байна…</p>;
  if (tests.length === 0) return <p className="text-sm text-muted-foreground">Бөглөсөн тест алга.</p>;
  return (
    <div className="grid gap-4 py-2">
      {tests.map((test) => (
        <article key={test.id}>
          <p className="font-medium">
            {test.title} · {formatDay(test.createdAt)}
          </p>
          <ul className="mt-2 grid gap-1">
            {test.answers.map((answer) => (
              <li key={answer.question} className="text-sm">
                <span className="text-muted-foreground">{answer.question}</span>
                <span> — {answer.answer || "—"}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
