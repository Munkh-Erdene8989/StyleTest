"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SiteLesson, SiteOperations, SiteSchedule, SiteStat } from "@/domain/types";
import { useDesk } from "./desk-context";

const area = "min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm";

export function SiteOperationsForm() {
  const { desk, reload } = useDesk();
  const [ops, setOps] = useState<SiteOperations | null>(desk?.operations ?? null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ops && desk?.operations) setOps(desk.operations);
  }, [desk, ops]);

  if (!ops) return null;

  function patch(next: Partial<SiteOperations>) {
    setOps((current) => (current ? { ...current, ...next } : current));
    setMessage("");
  }

  async function upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/site/media", { method: "POST", body: form });
    const json = await response.json();
    if (!response.ok) throw new Error("upload");
    return String(json.url);
  }

  return (
    <form
      className="desk-bento"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        const response = await fetch("/api/admin/site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operations: ops }),
        });
        const json = (await response.json().catch(() => ({}))) as { issues?: string[]; operations?: SiteOperations };
        setMessage(response.ok ? "Сайт дээр хадгаллаа." : json.issues?.[0] ?? "Хадгалж чадсангүй.");
        if (response.ok && json.operations) setOps(json.operations);
        if (response.ok) await reload();
        setSaving(false);
      }}
    >
      <section className="bento-tile bento-12">
        <h2>Нүүр</h2>
        <Label htmlFor="hero-kicker">Товч мөр</Label>
        <Input id="hero-kicker" value={ops.heroKicker} onChange={(event) => patch({ heroKicker: event.target.value })} />
        <Label htmlFor="hero-title">Гарчиг</Label>
        <Input id="hero-title" value={ops.heroTitle} onChange={(event) => patch({ heroTitle: event.target.value })} />
        <Label htmlFor="hero-emphasis">Онцолсон мөр</Label>
        <Input id="hero-emphasis" value={ops.heroEmphasis} onChange={(event) => patch({ heroEmphasis: event.target.value })} />
        <Label htmlFor="hero-lede">Тайлбар</Label>
        <textarea id="hero-lede" className={area} value={ops.heroLede} onChange={(event) => patch({ heroLede: event.target.value })} />
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="hero-action">Товч</Label>
            <Input id="hero-action" value={ops.heroAction} onChange={(event) => patch({ heroAction: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="hero-href">Холбоос</Label>
            <Input id="hero-href" value={ops.heroHref} placeholder="/tests эсвэл tel" onChange={(event) => patch({ heroHref: event.target.value })} />
          </div>
        </div>
        <StatList stats={ops.stats} onChange={(stats) => patch({ stats })} />
      </section>

      <section className="bento-tile bento-12">
        <h2>Бидний тухай</h2>
        <Label htmlFor="about-lead">Гарчиг</Label>
        <Input id="about-lead" value={ops.aboutLead} onChange={(event) => patch({ aboutLead: event.target.value })} />
        <Label htmlFor="about-emphasis">Онцолсон мөр</Label>
        <Input id="about-emphasis" value={ops.aboutEmphasis} onChange={(event) => patch({ aboutEmphasis: event.target.value })} />
        <Lines id="about-body" label="Догол мөр, мөр бүрээр" value={ops.aboutBody} onChange={(aboutBody) => patch({ aboutBody })} />
        <Lines id="about-ticks" label="Тэмдэглэл, мөр бүрээр" value={ops.aboutTicks} onChange={(aboutTicks) => patch({ aboutTicks })} />
        <div className="grid gap-3 md:grid-cols-3">
          {ops.aboutImages.map((image, index) => (
            <div key={`${image}-${index}`} className="grid gap-2">
              <img src={image} alt="" className="bento-photo" />
              <FileButton
                label="Зураг солих"
                onFile={async (file) => {
                  const url = await upload(file);
                  patch({ aboutImages: ops.aboutImages.map((item, itemIndex) => (itemIndex === index ? url : item)) });
                }}
                onError={() => setMessage("Зураг оруулж чадсангүй.")}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bento-tile bento-12">
        <h2>Үйлчилгээ</h2>
        <Label htmlFor="services-kicker">Хэсгийн нэр</Label>
        <Input id="services-kicker" value={ops.servicesKicker} onChange={(event) => patch({ servicesKicker: event.target.value })} />
        <Label htmlFor="services-title">Гарчиг</Label>
        <Input id="services-title" value={ops.servicesTitle} onChange={(event) => patch({ servicesTitle: event.target.value })} />
        <div className="grid gap-4">
          {ops.services.map((service, index) => (
            <article key={`${service.title}-${index}`} className="grid gap-2 rounded-lg border border-border p-3">
              <img src={service.image} alt="" className="bento-photo" />
              <FileButton
                label="Зураг солих"
                onFile={async (file) => {
                  const image = await upload(file);
                  patch({ services: replaceAt(ops.services, index, { ...service, image }) });
                }}
                onError={() => setMessage("Зураг оруулж чадсангүй.")}
              />
              <Input value={service.title} placeholder="Нэр" onChange={(event) => patch({ services: replaceAt(ops.services, index, { ...service, title: event.target.value }) })} />
              <Input value={service.subtitle} placeholder="Дэд гарчиг" onChange={(event) => patch({ services: replaceAt(ops.services, index, { ...service, subtitle: event.target.value }) })} />
              <textarea className={area} value={service.description} placeholder="Тайлбар" onChange={(event) => patch({ services: replaceAt(ops.services, index, { ...service, description: event.target.value }) })} />
              <Lines
                id={`service-includes-${index}`}
                label="Багтах зүйл, мөр бүрээр"
                value={service.includes}
                onChange={(includes) => patch({ services: replaceAt(ops.services, index, { ...service, includes }) })}
              />
              <div className="grid gap-2 md:grid-cols-3">
                <Input value={service.action} placeholder="Товч" onChange={(event) => patch({ services: replaceAt(ops.services, index, { ...service, action: event.target.value }) })} />
                <Input value={service.href} placeholder="/quiz эсвэл tel" onChange={(event) => patch({ services: replaceAt(ops.services, index, { ...service, href: event.target.value }) })} />
                <Input value={service.tag} placeholder="Тэмдэг, хоосон бол нуугдана" onChange={(event) => patch({ services: replaceAt(ops.services, index, { ...service, tag: event.target.value }) })} />
              </div>
              <Button type="button" variant="ghost" onClick={() => patch({ services: ops.services.filter((_, itemIndex) => itemIndex !== index) })}>
                Хасах
              </Button>
            </article>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            patch({
              services: [
                ...ops.services,
                { title: "Шинэ үйлчилгээ", subtitle: "", description: "", includes: [], image: ops.services[0]?.image ?? "/studio/service-color.jpg", tag: "", href: "tel", action: "Яг одоо тодорхойлох" },
              ],
            })
          }
        >
          Үйлчилгээ нэмэх
        </Button>
        <Label htmlFor="online-kicker">Доод дуудлагын нэр</Label>
        <Input id="online-kicker" value={ops.onlineKicker} onChange={(event) => patch({ onlineKicker: event.target.value })} />
        <Label htmlFor="online-title">Дуудлагын гарчиг</Label>
        <Input id="online-title" value={ops.onlineTitle} onChange={(event) => patch({ onlineTitle: event.target.value })} />
        <textarea id="online-body" className={area} value={ops.onlineBody} onChange={(event) => patch({ onlineBody: event.target.value })} />
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={ops.onlineAction} placeholder="Товч" onChange={(event) => patch({ onlineAction: event.target.value })} />
          <Input value={ops.onlineHref} placeholder="/quiz эсвэл tel" onChange={(event) => patch({ onlineHref: event.target.value })} />
        </div>
      </section>

      <section className="bento-tile bento-12">
        <h2>Сургалт</h2>
        <Label htmlFor="training-kicker">Хэсгийн нэр</Label>
        <Input id="training-kicker" value={ops.trainingKicker} onChange={(event) => patch({ trainingKicker: event.target.value })} />
        <Label htmlFor="training-title">Гарчиг</Label>
        <Input id="training-title" value={ops.trainingTitle} onChange={(event) => patch({ trainingTitle: event.target.value })} />
        <Label htmlFor="training-emphasis">Онцолсон мөр</Label>
        <Input id="training-emphasis" value={ops.trainingEmphasis} onChange={(event) => patch({ trainingEmphasis: event.target.value })} />
        <textarea id="training-body" className={area} value={ops.trainingBody} onChange={(event) => patch({ trainingBody: event.target.value })} />
        <Label htmlFor="training-notice">Мэдэгдлийн гарчиг</Label>
        <Input id="training-notice" value={ops.trainingNoticeTitle} onChange={(event) => patch({ trainingNoticeTitle: event.target.value })} />
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="training-start">Эхлэх огноо</Label>
            <Input id="training-start" value={ops.trainingStart} onChange={(event) => patch({ trainingStart: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="training-close">Элсэлт хаагдах</Label>
            <Input id="training-close" value={ops.trainingClose} onChange={(event) => patch({ trainingClose: event.target.value })} />
          </div>
        </div>
        <LessonList lessons={ops.lessons} onChange={(lessons) => patch({ lessons })} />
        <ScheduleList schedule={ops.schedule} onChange={(schedule) => patch({ schedule })} />
      </section>

      <section className="bento-tile bento-12">
        <h2>Галерей</h2>
        <Label htmlFor="gallery-kicker">Хэсгийн нэр</Label>
        <Input id="gallery-kicker" value={ops.galleryKicker} onChange={(event) => patch({ galleryKicker: event.target.value })} />
        <Label htmlFor="gallery-title">Гарчиг</Label>
        <Input id="gallery-title" value={ops.galleryTitle} onChange={(event) => patch({ galleryTitle: event.target.value })} />
        <div className="grid gap-3 md:grid-cols-3">
          {ops.gallery.map((item, index) => (
            <div key={`${item.label}-${index}`} className="grid gap-2">
              <img src={item.image} alt="" className="bento-square" />
              <FileButton
                label="Зураг солих"
                onFile={async (file) => {
                  const image = await upload(file);
                  patch({ gallery: replaceAt(ops.gallery, index, { ...item, image }) });
                }}
                onError={() => setMessage("Зураг оруулж чадсангүй.")}
              />
              <Input value={item.label} placeholder="Нэр" onChange={(event) => patch({ gallery: replaceAt(ops.gallery, index, { ...item, label: event.target.value }) })} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.tall}
                  onChange={(event) => patch({ gallery: replaceAt(ops.gallery, index, { ...item, tall: event.target.checked }) })}
                />
                Өндөр хавтан
              </label>
              <Button type="button" variant="ghost" onClick={() => patch({ gallery: ops.gallery.filter((_, itemIndex) => itemIndex !== index) })}>
                Хасах
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => patch({ gallery: [...ops.gallery, { image: ops.gallery[0]?.image ?? "/studio/gallery-summer.jpg", label: "Шинэ зураг", tall: false }] })}
        >
          Зураг нэмэх
        </Button>
      </section>

      <section className="bento-tile bento-12">
        <h2>Холбоос ба хөл</h2>
        <Label htmlFor="ops-facebook">Facebook</Label>
        <Input id="ops-facebook" value={ops.facebook} onChange={(event) => patch({ facebook: event.target.value })} />
        <Label htmlFor="ops-maps">Google Maps холбоос</Label>
        <Input id="ops-maps" value={ops.mapsUrl} onChange={(event) => patch({ mapsUrl: event.target.value })} />
        <Label htmlFor="ops-embed">Газрын зургийн оруулалт</Label>
        <Input id="ops-embed" value={ops.mapsEmbed} onChange={(event) => patch({ mapsEmbed: event.target.value })} />
        <Label htmlFor="ops-footer">Хөлийн тайлбар</Label>
        <textarea id="ops-footer" className={area} value={ops.footerTagline} onChange={(event) => patch({ footerTagline: event.target.value })} />
      </section>

      <div className="bento-12 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Хадгалж байна…" : "Сайт дээр хадгалах"}
        </Button>
        {message ? <p>{message}</p> : null}
      </div>
    </form>
  );
}

function Lines({ id, label, value, onChange }: { id: string; label: string; value: string[]; onChange: (next: string[]) => void }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} className={area} value={value.join("\n")} onChange={(event) => onChange(event.target.value.split("\n"))} />
    </div>
  );
}

function StatList({ stats, onChange }: { stats: SiteStat[]; onChange: (next: SiteStat[]) => void }) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {stats.map((stat, index) => (
        <div key={`${stat.label}-${index}`} className="grid gap-2">
          <Input value={stat.value} placeholder="Тоо" onChange={(event) => onChange(replaceAt(stats, index, { ...stat, value: event.target.value }))} />
          <Input value={stat.label} placeholder="Тайлбар" onChange={(event) => onChange(replaceAt(stats, index, { ...stat, label: event.target.value }))} />
        </div>
      ))}
    </div>
  );
}

function LessonList({ lessons, onChange }: { lessons: SiteLesson[]; onChange: (next: SiteLesson[]) => void }) {
  return (
    <div className="grid gap-3">
      {lessons.map((lesson, index) => (
        <div key={`${lesson.title}-${index}`} className="grid gap-2">
          <Input value={lesson.title} placeholder="Хичээлийн нэр" onChange={(event) => onChange(replaceAt(lessons, index, { ...lesson, title: event.target.value }))} />
          <Input value={lesson.description} placeholder="Тайлбар" onChange={(event) => onChange(replaceAt(lessons, index, { ...lesson, description: event.target.value }))} />
          <Button type="button" variant="ghost" onClick={() => onChange(lessons.filter((_, itemIndex) => itemIndex !== index))}>
            Хасах
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...lessons, { title: "Шинэ хичээл", description: "" }])}>
        Хичээл нэмэх
      </Button>
    </div>
  );
}

function ScheduleList({ schedule, onChange }: { schedule: SiteSchedule[]; onChange: (next: SiteSchedule[]) => void }) {
  return (
    <div className="grid gap-3">
      {schedule.map((row, index) => (
        <div key={`${row.label}-${index}`} className="grid gap-2 md:grid-cols-2">
          <Input value={row.label} placeholder="Өдөр" onChange={(event) => onChange(replaceAt(schedule, index, { ...row, label: event.target.value }))} />
          <Input value={row.value} placeholder="Цаг" onChange={(event) => onChange(replaceAt(schedule, index, { ...row, value: event.target.value }))} />
        </div>
      ))}
    </div>
  );
}

function FileButton({ label, onFile, onError }: { label: string; onFile: (file: File) => Promise<void>; onError: () => void }) {
  return (
    <label className="bento-file">
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            await onFile(file);
          } catch {
            onError();
          }
        }}
      />
    </label>
  );
}

function replaceAt<T>(items: T[], index: number, next: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? next : item));
}
