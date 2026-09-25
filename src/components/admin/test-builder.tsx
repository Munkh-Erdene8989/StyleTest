"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { bandIssues, blankDraft, defaultMethod, defaultRule, scoreSpan, type TestDraft } from "@/domain/admin-content";
import type { TestKind } from "@/domain/types";
import { PRICES } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";
import { kindLabel } from "./labels";

const kinds: TestKind[] = ["personality", "stress", "fun", "youth"];
const outline = ["Тайлбар", "Давуу тал", "Анзаарах хэв маяг", "Өдөр тутмын жишээ"];

export function TestBuilder({ id, from }: { id: string; from: string }) {
  const router = useRouter();
  const { desk, reload } = useDesk();
  const [draft, setDraft] = useState<TestDraft | null>(null);
  const [missing, setMissing] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(null);
    setMissing(false);
    setIssues([]);
    setMessage("");
  }, [id, from]);

  useEffect(() => {
    if (!desk || draft) return;
    if (id === "new") {
      const source = desk.tests.find((item) => item.version.id === from);
      setDraft(source ? cloneDraft(source) : blankDraft());
      return;
    }
    const found = desk.tests.find((item) => item.version.id === id);
    if (!found) {
      setMissing(true);
      return;
    }
    setDraft(structuredClone(found));
  }, [desk, draft, id, from]);

  if (missing) return <p>Асуулга олдсонгүй.</p>;
  if (!draft) return <p>Ачаалж байна…</p>;

  const span = scoreSpan(draft.version.questions);
  const problems = bandIssues(draft.version.bands, span);
  const builtin = id !== "new" && Boolean(desk?.tests.find((item) => item.version.id === id)?.builtin);

  function patch(next: TestDraft) {
    setDraft(next);
    setMessage("");
  }

  function setKind(kind: TestKind) {
    patch({
      ...draft!,
      rule: draft!.rule === defaultRule(draft!.version.kind) ? defaultRule(kind) : draft!.rule,
      test: {
        ...draft!.test,
        kind,
        priceMnt: kind === "personality" ? draft!.test.priceMnt || PRICES.personality_report : 0,
        productCode: kind === "personality" ? "personality_report" : null,
      },
      version: {
        ...draft!.version,
        kind,
        minAge: kind === "youth" || kind === "fun" ? 0 : 18,
        maxAge: kind === "youth" ? 17 : null,
        bands: draft!.version.bands.map((band) => ({
          ...band,
          paidOutline: kind === "personality" ? (band.paidOutline.length === 4 ? band.paidOutline : [...outline]) : [],
        })),
      },
    });
  }

  async function save() {
    setSaving(true);
    setIssues([]);
    const response = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft }),
    });
    const json = (await response.json()) as { version?: { id: string }; issues?: string[]; error?: string };
    setSaving(false);
    if (!response.ok) {
      setIssues(json.issues ?? ["Хадгалж чадсангүй."]);
      return;
    }
    setMessage("Хадгаллаа.");
    await reload();
    if (json.version?.id && json.version.id !== id) router.replace(`/admin/tests/${json.version.id}`);
  }

  async function remove() {
    if (!draft || builtin) return;
    setSaving(true);
    const response = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remove: true, versionId: draft.version.id }),
    });
    setSaving(false);
    if (!response.ok) {
      const json = (await response.json()) as { issues?: string[] };
      setIssues(json.issues ?? ["Устгаж чадсангүй."]);
      return;
    }
    await reload();
    router.push("/admin/tests");
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,42rem)_20rem]">
      <div className="grid gap-4">
        <DeskTitle title={id === "new" ? "Шинэ асуулга" : "Асуулга засах"} text="Асуулт, сонголтын оноо, үр дүнгийн муж. Нийлбэр оноо бүлгийг сонгоно." />
        <section className="grid gap-3 rounded-lg border border-border bg-card p-5">
          <Field label="Гарчиг">
            <Input value={draft.version.title} onChange={(event) => patch({ ...draft, version: { ...draft.version, title: event.target.value } })} />
          </Field>
          <Field label="Тайлбар">
            <Textarea value={draft.version.description} onChange={(event) => patch({ ...draft, version: { ...draft.version, description: event.target.value } })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Төрөл">
              <Select value={draft.version.kind} disabled={builtin} onChange={(event) => setKind(event.target.value as TestKind)}>
                {kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kindLabel[kind]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Холбоос">
              <Input
                value={draft.test.slug}
                disabled={builtin}
                placeholder="jishlee-ner"
                onChange={(event) => patch({ ...draft, test: { ...draft.test, slug: event.target.value.toLowerCase() } })}
              />
            </Field>
            <Field label="Минут">
              <Input
                type="number"
                value={draft.version.minutes}
                onChange={(event) => patch({ ...draft, version: { ...draft.version, minutes: Number(event.target.value) } })}
              />
            </Field>
            <Field label="Үнэ, ₮">
              <Input
                type="number"
                disabled={draft.version.kind !== "personality"}
                value={draft.test.priceMnt}
                onChange={(event) => patch({ ...draft, test: { ...draft.test, priceMnt: Number(event.target.value) } })}
              />
            </Field>
          </div>
          <Field label="Анхааруулга">
            <Textarea value={draft.version.disclaimer} onChange={(event) => patch({ ...draft, version: { ...draft.version, disclaimer: event.target.value } })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!draft.hidden}
              onChange={(event) => patch({ ...draft, hidden: !event.target.checked })}
            />
            Сайт дээр харуулах
          </label>
        </section>

        {draft.version.questions.map((question, questionIndex) => (
          <section key={question.id} className="grid gap-3 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Асуулт {questionIndex + 1}</p>
              <div className="flex gap-1">
                <IconButton label="Дээш" disabled={questionIndex === 0} onClick={() => moveQuestion(questionIndex, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </IconButton>
                <IconButton label="Доош" disabled={questionIndex === draft.version.questions.length - 1} onClick={() => moveQuestion(questionIndex, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </IconButton>
                <IconButton label="Устгах" onClick={() => removeQuestion(questionIndex)}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <Textarea
              value={question.text}
              placeholder="Асуултаа бичнэ үү"
              onChange={(event) => updateQuestion(questionIndex, { ...question, text: event.target.value })}
            />
            <div className="grid gap-2">
              {question.options.map((option, optionIndex) => (
                <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_5.5rem_auto] gap-2">
                  <Input
                    value={option.label}
                    placeholder="Сонголт"
                    onChange={(event) => updateOption(questionIndex, optionIndex, { ...option, label: event.target.value })}
                  />
                  <Input
                    type="number"
                    aria-label="Оноо"
                    value={option.score}
                    onChange={(event) => updateOption(questionIndex, optionIndex, { ...option, score: Number(event.target.value) })}
                  />
                  <IconButton label="Сонголт устгах" onClick={() => removeOption(questionIndex, optionIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => addOption(questionIndex)}>
                <Plus className="h-4 w-4" /> Сонголт
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => likert(questionIndex)}>
                0–3 шатлал
              </Button>
            </div>
          </section>
        ))}
        <Button type="button" variant="secondary" onClick={addQuestion}>
          <Plus className="h-4 w-4" /> Асуулт нэмэх
        </Button>

        <section className="grid gap-3 rounded-lg border border-border bg-card p-5">
          <h2 className="font-medium">Үр дүнгийн муж</h2>
          <p className="text-sm text-muted-foreground">
            Боломжит оноо {span.min}–{span.max}. Муж энэ зайг завсаргүй хаана.
          </p>
          {draft.version.bands.map((band, bandIndex) => (
            <div key={band.id} className="grid gap-2 rounded-md border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-[6rem_6rem_minmax(0,1fr)_auto]">
                <Input type="number" aria-label="Доод" value={band.min} onChange={(event) => updateBand(bandIndex, { ...band, min: Number(event.target.value) })} />
                <Input type="number" aria-label="Дээд" value={band.max} onChange={(event) => updateBand(bandIndex, { ...band, max: Number(event.target.value) })} />
                <Input value={band.title} placeholder="Үр дүнгийн нэр" onChange={(event) => updateBand(bandIndex, { ...band, title: event.target.value })} />
                <IconButton label="Муж устгах" onClick={() => removeBand(bandIndex)}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
              <Textarea value={band.summary} placeholder="Товч үр дүн" onChange={(event) => updateBand(bandIndex, { ...band, summary: event.target.value })} />
              <Textarea
                value={band.detail.join("\n")}
                placeholder="Дэлгэрэнгүй, мөр бүр нэг өгүүлбэр"
                onChange={(event) => updateBand(bandIndex, { ...band, detail: event.target.value.split("\n") })}
              />
              {draft.version.kind === "personality" ? (
                <Field label="Төлбөртэй тайлангийн 4 гарчиг">
                  <Textarea
                    value={band.paidOutline.join("\n")}
                    onChange={(event) => updateBand(bandIndex, { ...band, paidOutline: event.target.value.split("\n").slice(0, 4) })}
                  />
                </Field>
              ) : null}
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addBand}>
            <Plus className="h-4 w-4" /> Муж нэмэх
          </Button>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Field label="Статус">
            <Select
              value={draft.version.status}
              onChange={(event) => patch({ ...draft, version: { ...draft.version, status: event.target.value as TestDraft["version"]["status"] } })}
            >
              <option value="demo">Үзүүлэх</option>
              <option value="license_pending">Лиценз хүлээгдэж буй</option>
              <option value="approved">Баталгаажсан</option>
            </Select>
          </Field>
          <Field label="Орчуулга">
            <Select
              value={draft.version.translationReview}
              onChange={(event) =>
                patch({
                  ...draft,
                  version: { ...draft.version, translationReview: event.target.value === "reviewed" ? "reviewed" : "none" },
                })
              }
            >
              <option value="none">Хянаагүй</option>
              <option value="reviewed">Хянасан</option>
            </Select>
          </Field>
          <Field label="Лицензийн дугаар">
            <Input
              value={draft.version.licenseRef ?? ""}
              onChange={(event) => patch({ ...draft, version: { ...draft.version, licenseRef: event.target.value || null } })}
            />
          </Field>
        </section>

        {issues.length ? (
          <ul className="rounded-md bg-accent px-4 py-3 text-sm text-accent-foreground">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}
        {message ? <p>{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={saving} onClick={() => void save()}>
            Хадгалах
          </Button>
          {id !== "new" && !builtin ? (
            <Button type="button" variant="destructive" disabled={saving} onClick={() => void remove()}>
              Устгах
            </Button>
          ) : null}
        </div>
      </div>

      <aside className="grid gap-3 xl:sticky xl:top-6">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-medium">Бодох арга</h2>
          <p className="mt-2 text-sm">
            Одоогийн боломжит оноо {span.min}–{span.max}. {draft.version.questions.length} асуулт.
          </p>
          {problems.length ? (
            <ul className="mt-2 text-sm text-destructive">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Муж бүтэн хаагдсан. AI энэ оноог өөрчлөхгүй.</p>
          )}
        </section>
        <Field label="Дүрэм">
          <Textarea value={draft.rule} onChange={(event) => patch({ ...draft, rule: event.target.value })} />
        </Field>
        <Field label="Аргачлалын тайлбар">
          <Textarea value={draft.method} onChange={(event) => patch({ ...draft, method: event.target.value })} />
        </Field>
        <Button type="button" variant="ghost" onClick={() => patch({ ...draft, method: defaultMethod(), rule: defaultRule(draft.version.kind) })}>
          Тайлбарыг анхны текстээр
        </Button>
      </aside>
    </div>
  );

  function updateQuestion(index: number, question: TestDraft["version"]["questions"][number]) {
    const questions = draft!.version.questions.map((item, itemIndex) => (itemIndex === index ? question : item));
    patch({ ...draft!, version: { ...draft!.version, questions } });
  }

  function updateOption(questionIndex: number, optionIndex: number, option: TestDraft["version"]["questions"][number]["options"][number]) {
    const question = draft!.version.questions[questionIndex];
    updateQuestion(questionIndex, {
      ...question,
      options: question.options.map((item, index) => (index === optionIndex ? option : item)),
    });
  }

  function addOption(questionIndex: number) {
    const question = draft!.version.questions[questionIndex];
    updateQuestion(questionIndex, {
      ...question,
      options: [...question.options, { id: nid("o"), label: "", score: 0 }],
    });
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const question = draft!.version.questions[questionIndex];
    updateQuestion(questionIndex, { ...question, options: question.options.filter((_, index) => index !== optionIndex) });
  }

  function likert(questionIndex: number) {
    updateQuestion(questionIndex, {
      ...draft!.version.questions[questionIndex],
      options: [
        { id: "0", label: "Бараг үгүй", score: 0 },
        { id: "1", label: "Заримдаа", score: 1 },
        { id: "2", label: "Олонтоо", score: 2 },
        { id: "3", label: "Бараг өдөр бүр", score: 3 },
      ],
    });
  }

  function addQuestion() {
    patch({
      ...draft!,
      version: {
        ...draft!.version,
        questions: [...draft!.version.questions, { id: nid("q"), text: "", options: [{ id: nid("a"), label: "", score: 0 }, { id: nid("b"), label: "", score: 1 }] }],
      },
    });
  }

  function removeQuestion(index: number) {
    patch({ ...draft!, version: { ...draft!.version, questions: draft!.version.questions.filter((_, itemIndex) => itemIndex !== index) } });
  }

  function moveQuestion(index: number, delta: number) {
    const questions = [...draft!.version.questions];
    const [item] = questions.splice(index, 1);
    questions.splice(index + delta, 0, item);
    patch({ ...draft!, version: { ...draft!.version, questions } });
  }

  function updateBand(index: number, band: TestDraft["version"]["bands"][number]) {
    patch({
      ...draft!,
      version: { ...draft!.version, bands: draft!.version.bands.map((item, itemIndex) => (itemIndex === index ? band : item)) },
    });
  }

  function addBand() {
    patch({
      ...draft!,
      version: {
        ...draft!.version,
        bands: [
          ...draft!.version.bands,
          {
            id: nid("band"),
            min: span.max,
            max: span.max,
            title: "",
            summary: "",
            detail: [""],
            paidOutline: draft!.version.kind === "personality" ? [...outline] : [],
          },
        ],
      },
    });
  }

  function removeBand(index: number) {
    patch({ ...draft!, version: { ...draft!.version, bands: draft!.version.bands.filter((_, itemIndex) => itemIndex !== index) } });
  }
}

function cloneDraft(source: TestDraft): TestDraft {
  const next = blankDraft();
  const slug = `${source.test.slug}-copy`.toLowerCase().replace(/[^a-z0-9-]/g, "");
  next.test.slug = slug;
  next.test.kind = source.version.kind;
  next.test.priceMnt = source.test.priceMnt;
  next.test.productCode = source.test.productCode;
  next.version = structuredClone(source.version);
  next.version.id = "new-v1";
  next.version.testId = "custom-new";
  next.version.title = `${source.version.title} хуулбар`;
  next.rule = source.rule;
  next.method = source.method;
  next.hidden = true;
  return next;
}

function nid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 text-sm">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Select(props: ComponentProps<"select">) {
  return <select className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} />;
}

function IconButton({ label, children, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <Button type="button" size="icon" variant="ghost" aria-label={label} {...props}>
      {children}
    </Button>
  );
}
