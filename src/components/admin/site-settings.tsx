"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HelpContact, StudioMember, StudioProfile, StudioReview } from "@/domain/types";
import { useDesk } from "./desk-context";

export function SiteSettings() {
  const { desk, reload } = useDesk();
  const [studio, setStudio] = useState<StudioProfile | null>(desk?.studio ?? null);
  const [name, setName] = useState(desk?.appName ?? "");
  const [contacts, setContacts] = useState<HelpContact[]>(desk?.helpContacts ?? []);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [adminNote, setAdminNote] = useState("");
  useEffect(() => {
    if (!studio && desk?.studio) setStudio(desk.studio);
  }, [desk, studio]);
  if (!desk || !studio) return null;
  const founder = studio.team[0];
  const specialists = studio.team.slice(1);
  const [leadReview, ...restReviews] = studio.reviews;

  async function upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/site/media", { method: "POST", body: form });
    const json = await response.json();
    if (!response.ok) throw new Error("upload");
    return String(json.url);
  }

  function setTeam(index: number, patch: Partial<StudioMember>) {
    setStudio({ ...studio!, team: studio!.team.map((member, memberIndex) => (memberIndex === index ? { ...member, ...patch } : member)) });
  }

  function setReview(index: number, patch: Partial<StudioReview>) {
    setStudio({ ...studio!, reviews: studio!.reviews.map((review, reviewIndex) => (reviewIndex === index ? { ...review, ...patch } : review)) });
  }

  return (
    <form
      className="desk-bento"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage("");
        const response = await fetch("/api/admin/site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appName: name, helpContacts: contacts, studio }),
        });
        setMessage(response.ok ? "Хадгаллаа." : "Хадгалж чадсангүй.");
        if (response.ok) await reload();
      }}
    >
      <section className="bento-tile bento-7 bento-fill">
        <h2>Header зураг</h2>
        <img src={studio.headerImage} alt="" className="bento-photo" />
        <label className="bento-file">
          Зураг солих
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                setStudio({ ...studio, headerImage: await upload(file) });
              } catch {
                setMessage("Зураг оруулж чадсангүй.");
              }
            }}
          />
        </label>
      </section>
      <section className="bento-tile bento-5 bento-fill">
        <h2>Холбоо барих</h2>
        <Label htmlFor="site-phone">Утас</Label>
        <Input id="site-phone" value={studio.phone} onChange={(event) => setStudio({ ...studio, phone: event.target.value })} />
        <Label htmlFor="site-email">И-мэйл</Label>
        <Input id="site-email" type="email" value={studio.email} onChange={(event) => setStudio({ ...studio, email: event.target.value })} />
        <Label htmlFor="app-name">Сайтын нэр</Label>
        <Input id="app-name" value={name} onChange={(event) => setName(event.target.value)} />
        <Label htmlFor="site-address">Хаяг</Label>
        <textarea
          id="site-address"
          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={studio.address}
          onChange={(event) => setStudio({ ...studio, address: event.target.value })}
        />
      </section>

      {founder ? (
        <section className="bento-tile bento-5">
          <h2>Үүсгэн байгуулагч</h2>
          <img src={founder.image} alt="" className="bento-portrait" />
          <Input value={founder.name} placeholder="Нэр" onChange={(event) => setTeam(0, { name: event.target.value })} />
          <Input value={founder.role} placeholder="Мэргэжил" onChange={(event) => setTeam(0, { role: event.target.value })} />
          <label className="bento-file">
            Зураг солих
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  setTeam(0, { image: await upload(file) });
                } catch {
                  setMessage("Зураг оруулж чадсангүй.");
                }
              }}
            />
          </label>
        </section>
      ) : null}
      <section className="bento-tile bento-7">
        <h2>Мэргэжилтнүүд</h2>
        <div className="bento-people">
          {specialists.map((member, index) => (
            <div key={`${member.name}-${index}`} className="grid gap-2">
              <img src={member.image} alt="" className="bento-square" />
              <Input value={member.name} placeholder="Нэр" onChange={(event) => setTeam(index + 1, { name: event.target.value })} />
              <Input value={member.role} placeholder="Мэргэжил" onChange={(event) => setTeam(index + 1, { role: event.target.value })} />
              <label className="bento-file">
                Зураг солих
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      setTeam(index + 1, { image: await upload(file) });
                    } catch {
                      setMessage("Зураг оруулж чадсангүй.");
                    }
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="bento-tile bento-8">
        <h2>Сэтгэгдэл</h2>
        {leadReview ? (
          <div className="grid gap-2 rounded-lg bg-secondary p-3">
            <Input value={leadReview.name} placeholder="Нэр" onChange={(event) => setReview(0, { name: event.target.value })} />
            <Input value={leadReview.tag} placeholder="Тэмдэг" onChange={(event) => setReview(0, { tag: event.target.value })} />
            <textarea
              className="min-h-28 rounded-md border border-input bg-card px-3 py-2 text-sm"
              value={leadReview.text}
              placeholder="Сэтгэгдэл"
              onChange={(event) => setReview(0, { text: event.target.value })}
            />
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-3">
          {restReviews.map((review, index) => (
            <div key={`${review.name}-${index}`} className="grid gap-2">
              <Input value={review.name} placeholder="Нэр" onChange={(event) => setReview(index + 1, { name: event.target.value })} />
              <Input value={review.tag} placeholder="Тэмдэг" onChange={(event) => setReview(index + 1, { tag: event.target.value })} />
              <textarea
                className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={review.text}
                placeholder="Сэтгэгдэл"
                onChange={(event) => setReview(index + 1, { text: event.target.value })}
              />
              <Button type="button" variant="ghost" onClick={() => setStudio({ ...studio, reviews: studio.reviews.filter((_, reviewIndex) => reviewIndex !== index + 1) })}>
                Хасах
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => setStudio({ ...studio, reviews: [...studio.reviews, { name: "", text: "", tag: "" }] })}>
          Сэтгэгдэл нэмэх
        </Button>
      </section>

      <section className="bento-tile bento-4">
        <h2>Админ</h2>
        <p>Нэмсэн имэйл рүү нууц үг үүсгэх холбоос очно.</p>
        <ul className="grid gap-2">
          {desk.admins.map((admin) => (
            <li key={admin} className="flex items-center justify-between gap-2 text-sm">
              <span>{admin}</span>
              {admin === desk.admins[0] ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    const response = await fetch("/api/admin/admins", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: admin }),
                    });
                    setAdminNote(response.ok ? "Админыг хаслаа." : "Хасаж чадсангүй.");
                    if (response.ok) await reload();
                  }}
                >
                  Хасах
                </Button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-auto grid gap-2">
          <Input
            type="email"
            value={email}
            placeholder="Шинэ админ имэйл"
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              setAdminNote("");
              const response = await fetch("/api/admin/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              setAdminNote(response.ok ? "Нууц үг үүсгэх холбоосыг илгээлээ." : "Энэ имэйлээр админ нэмэгдсэнгүй.");
              if (response.ok) {
                setEmail("");
                await reload();
              }
            }}
          >
            Админ нэмэх
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              setAdminNote("");
              const response = await fetch("/api/auth/password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: desk.viewer.email }),
              });
              setAdminNote(response.ok ? "Нууц үг шинэчлэх холбоосыг илгээлээ." : "Илгээж чадсангүй.");
            }}
          >
            Миний нууц үг солих
          </Button>
          {adminNote ? <p>{adminNote}</p> : null}
        </div>
      </section>

      <section className="bento-tile bento-12">
        <h2>Стрессийн тусламжийн холбоо</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {contacts.map((contact, index) => (
            <div key={index} className="grid gap-2">
              <Input value={contact.name} placeholder="Нэр" onChange={(event) => setContacts(contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)))} />
              <Input value={contact.phone} placeholder="Утас" onChange={(event) => setContacts(contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, phone: event.target.value } : item)))} />
              <Input value={contact.note} placeholder="Тэмдэглэл" onChange={(event) => setContacts(contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, note: event.target.value } : item)))} />
              <Input value={contact.source} placeholder="Эх сурвалж" onChange={(event) => setContacts(contacts.map((item, itemIndex) => (itemIndex === index ? { ...item, source: event.target.value } : item)))} />
              <Button type="button" variant="ghost" onClick={() => setContacts(contacts.filter((_, itemIndex) => itemIndex !== index))}>
                Хасах
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => setContacts([...contacts, { name: "", phone: "", note: "", source: "" }])}>
          Холбоо нэмэх
        </Button>
      </section>

      <div className="bento-12 flex flex-wrap items-center gap-3">
        <Button type="submit">Хадгалах</Button>
        {message ? <p>{message}</p> : null}
      </div>
    </form>
  );
}
