"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listedOnSite } from "@/domain/admin-content";
import { quizPriceError } from "@/domain/money";
import { formatMnt } from "@/lib/format";
import { DeskTitle } from "./admin-frame";
import { QuizPriceField } from "./quiz-price-field";
import { useDesk } from "./desk-context";
import { kindLabel, statusLabel } from "./labels";

export function TestList() {
  const { desk, reload } = useDesk();
  const [price, setPrice] = useState(desk ? String(desk.quizPriceMnt) : "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const priceError = quizPriceError(price);
  if (!desk) return null;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <DeskTitle title="Асуулга" text="Google Forms шиг асуулт, сонголт, оноо, үр дүнгийн муж. Хадгалсан тест сайт дээр гарна." />
        <Button asChild>
          <Link href="/admin/tests/new">Шинэ асуулга</Link>
        </Button>
      </div>
      <form
        className="mb-6 grid max-w-xl gap-3 rounded-lg border border-border bg-card p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (priceError) {
            setNote(priceError);
            return;
          }
          setSaving(true);
          setNote("");
          const response = await fetch("/api/admin/site", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quizPriceMnt: price.trim() }),
          });
          const json = (await response.json().catch(() => ({}))) as { issues?: string[]; quizPriceMnt?: number };
          setNote(response.ok ? "Хадгаллаа." : json.issues?.[0] ?? "Хадгалж чадсангүй.");
          if (response.ok) {
            if (typeof json.quizPriceMnt === "number") setPrice(String(json.quizPriceMnt));
            await reload();
          }
          setSaving(false);
        }}
      >
        <div>
          <h2 className="text-lg font-medium">Тестийн үнэ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Нүүр, биеийн хэлбэр, хувийн хэв маяг, стайл тест одоо {formatMnt(desk.quizPriceMnt)}₮. Дараагийн төлбөр энэ үнээр үүснэ.
          </p>
        </div>
        <QuizPriceField id="quiz-price" label="Үнэ, ₮" value={price} onChange={(value) => { setPrice(value); setNote(""); }} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving || Boolean(priceError)}>
            {saving ? "Хадгалж байна…" : "Үнэ хадгалах"}
          </Button>
          {note ? <p className="text-sm">{note}</p> : null}
        </div>
      </form>
      <ul className="grid gap-3">
        {desk.tests.map((test) => (
          <li key={test.version.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium">{test.version.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {kindLabel[test.version.kind]} · {test.version.questions.length} асуулт · {test.version.bands.length} үр дүн · оноо {test.span.min}–{test.span.max}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{statusLabel[test.version.status] ?? test.version.status}</Badge>
                {test.builtin ? <Badge variant="secondary">Систем</Badge> : <Badge variant="secondary">Өөрийн</Badge>}
                {listedOnSite(test) ? <Badge>Сайт дээр</Badge> : <Badge variant="outline">Сайт дээр гарахгүй</Badge>}
                {test.issues.length ? <Badge variant="warn">Муж шалгах</Badge> : null}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link href={`/admin/tests/${test.version.id}`}>Засах</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/tests/new?from=${test.version.id}`}>Хуулбарлах</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
