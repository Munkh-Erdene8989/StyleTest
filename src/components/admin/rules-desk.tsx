"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";
import { kindLabel } from "./labels";

export function RulesDesk() {
  const { desk } = useDesk();
  if (!desk) return null;
  return (
    <div className="max-w-3xl">
      <DeskTitle
        title="Дүрэм ба аргачлал"
        text="Асуулгын оноог AI өөрчлөхгүй. Нийлбэр аль мужид багтаж байгаагаар бүлэг сонгогдоно. AI зөвхөн тайлбар бичнэ."
      />
      <section className="mb-8 rounded-lg border border-border bg-card p-5">
        <h2 className="font-medium">AI тайлан юу хүлээж авдаг вэ</h2>
        <p className="mt-2">
          Сонгогдсон бүлэг, төлбөртэй тайлангийн гарчиг, асуулт ба хариултын хос. Гарчиг таарахгүй, эсвэл хариу буруу хэлбэртэй бол загвар текст үлдэнэ. Оноо солигдохгүй.
        </p>
      </section>
      <div className="grid gap-4">
        {desk.tests.map((test) => (
          <article key={test.version.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{test.version.title}</h2>
              <Link href={`/admin/tests/${test.version.id}`} className="text-sm underline">
                Засах
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {kindLabel[test.version.kind]} · боломжит оноо {test.span.min}–{test.span.max}
            </p>
            <h3 className="mt-4 text-sm font-medium">Дүрэм</h3>
            <p className="mt-1">{test.rule}</p>
            <h3 className="mt-4 text-sm font-medium">Бодох арга</h3>
            <p className="mt-1">{test.method}</p>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Үр дүн</th>
                  <th className="py-2 font-medium">Муж</th>
                </tr>
              </thead>
              <tbody>
                {test.version.bands.map((band) => (
                  <tr key={band.id} className="border-b border-border">
                    <td className="py-2">{band.title}</td>
                    <td className="py-2">
                      {band.min}–{band.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {test.version.kind === "fun"
              ? test.version.bands.map((band) => (
                  <FunCopy key={band.id} bandId={band.id} title={desk.funCopy[band.id]?.title ?? ""} summary={desk.funCopy[band.id]?.summary ?? ""} />
                ))
              : null}
            {test.issues.length ? (
              <ul className="mt-3 text-sm text-destructive">
                {test.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="font-medium">Стайл студийн арга</h2>
        <p className="mt-2">
          Стайл асуулгын нийлбэр биш. Таалагдсан жишээ өнгө, силуэт, хэв маяг, хээнд илүү жин өгнө. Тэмүүлж буй жишээ бага жинтэй. Таалагдаагүй жишээ эсрэгээр хасна. Оффис бол нямбай, гэр бол сул тух руу хоёр оноо нэмнэ. Доод босгонд хүрээгүй чиглэл хасагдана. Өмнө гарсантай ижил өнгө, силуэт, хэв маягтай чиглэл дахин санал болгохгүй. AI энэ эрэмбийг өөрчлөхгүй, сонгогдсон чиглэлийн тайлбарыг бичнэ.
        </p>
      </section>
    </div>
  );
}

function FunCopy({ bandId, title, summary }: { bandId: string; title: string; summary: string }) {
  const { reload } = useDesk();
  const [nextTitle, setNextTitle] = useState(title);
  const [nextSummary, setNextSummary] = useState(summary);
  const [note, setNote] = useState("");
  return (
    <form
      className="mt-3 grid gap-2 rounded-md bg-secondary p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch("/api/admin/fun", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bandId, title: nextTitle, summary: nextSummary }),
        });
        setNote(response.ok ? "Хадгаллаа." : "Хадгалж чадсангүй.");
        if (response.ok) await reload();
      }}
    >
      <p className="text-sm">Нийтийн гарчиг · {bandId}</p>
      <Input value={nextTitle} placeholder="Гарчиг" onChange={(event) => setNextTitle(event.target.value)} />
      <Input value={nextSummary} placeholder="Товч" onChange={(event) => setNextSummary(event.target.value)} />
      <Button type="submit" size="sm" variant="outline">
        Гарчиг хадгалах
      </Button>
      {note ? <p className="text-sm">{note}</p> : null}
    </form>
  );
}
