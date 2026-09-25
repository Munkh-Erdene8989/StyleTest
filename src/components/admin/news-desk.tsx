"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { NewsPost, NewsSwatch } from "@/domain/news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";

const swatches: { id: NewsSwatch; label: string }[] = [
  { id: "personality", label: "Чавга" },
  { id: "style", label: "Хөх" },
  { id: "earth", label: "Хүрэн" },
];

export function NewsDesk() {
  const { desk, reload } = useDesk();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [index, setIndex] = useState(0);
  const [issues, setIssues] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (desk) setPosts(structuredClone(desk.news));
  }, [desk]);

  if (!desk) return null;
  const post = posts[index];

  function update(next: NewsPost) {
    setPosts(posts.map((item, itemIndex) => (itemIndex === index ? next : item)));
    setMessage("");
  }

  async function save() {
    setSaving(true);
    setIssues([]);
    const response = await fetch("/api/admin/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts }),
    });
    const json = (await response.json()) as { issues?: string[] };
    setSaving(false);
    if (!response.ok) {
      setIssues(json.issues ?? ["Хадгалж чадсангүй."]);
      return;
    }
    setMessage("Нийтэллээ.");
    await reload();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <DeskTitle title="Мэдээ" text="Нийтэлсэн пост /news дээр шууд гарна." />
        <Button
          type="button"
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            setPosts([
              { slug: "", title: "", publishedOn: today, topic: "Өнгө", swatch: "personality", excerpt: "", body: [""] },
              ...posts,
            ]);
            setIndex(0);
          }}
        >
          Шинэ пост
        </Button>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,40rem)]">
        <ul className="grid gap-2">
          {posts.map((item, itemIndex) => (
            <li key={`${item.slug}-${itemIndex}`}>
              <button
                type="button"
                className={`w-full rounded-md border px-3 py-2 text-left ${itemIndex === index ? "border-primary bg-card" : "border-border bg-card"}`}
                onClick={() => setIndex(itemIndex)}
              >
                {item.title || "Гарчиггүй"}
              </button>
            </li>
          ))}
        </ul>
        {post ? (
          <div className="grid gap-3 rounded-lg border border-border bg-card p-5">
            <Field label="Гарчиг">
              <Input value={post.title} onChange={(event) => update({ ...post, title: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Холбоос">
                <Input value={post.slug} onChange={(event) => update({ ...post, slug: event.target.value.toLowerCase() })} />
              </Field>
              <Field label="Огноо">
                <Input type="date" value={post.publishedOn} onChange={(event) => update({ ...post, publishedOn: event.target.value })} />
              </Field>
              <Field label="Сэдэв">
                <Input value={post.topic} onChange={(event) => update({ ...post, topic: event.target.value })} />
              </Field>
              <Field label="Өнгө">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                  value={post.swatch}
                  onChange={(event) => update({ ...post, swatch: event.target.value as NewsSwatch })}
                >
                  {swatches.map((swatch) => (
                    <option key={swatch.id} value={swatch.id}>
                      {swatch.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Товч">
              <Textarea value={post.excerpt} onChange={(event) => update({ ...post, excerpt: event.target.value })} />
            </Field>
            <Field label="Текст, мөр бүр нэг хэсэг">
              <Textarea className="min-h-48" value={post.body.join("\n\n")} onChange={(event) => update({ ...post, body: event.target.value.split(/\n\n+/) })} />
            </Field>
            {issues.length ? (
              <ul className="text-sm text-destructive">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
            {message ? <p>{message}</p> : null}
            <div className="flex gap-2">
              <Button type="button" disabled={saving} onClick={() => void save()}>
                Нийтлэх
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next = posts.filter((_, itemIndex) => itemIndex !== index);
                  setPosts(next);
                  setIndex(0);
                }}
              >
                Хасах
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Пост алга. Шинэ пост нэмнэ.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
