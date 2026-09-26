import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgeForm } from "@/components/age-form";
import { canStartTest } from "@/domain/age";
import { optionalUser } from "@/server/auth";
import { testBySlug } from "@/server/catalog";
import { resumeSession } from "@/server/session-service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const row = await testBySlug(slug);
  if (!row) return { title: "Тест" };
  return { title: row.version.title, description: row.version.description };
}

export default async function TestIntroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await testBySlug(slug);
  if (!row) notFound();
  const { version } = row;
  const user = await optionalUser();
  const allowed = Boolean(user && canStartTest(version.kind, user.ageBand));
  const resume = allowed && user ? await resumeSession(user, slug) : null;
  return (
    <main>
      <h1>{version.title}</h1>
      {version.status === "demo" ? <p className="banner">Үзүүлэх хувилбар. Баталгаажсан хэмжүүр биш.</p> : null}
      <p>{version.description}</p>
      <p className="note">{version.disclaimer}</p>
      {version.kind === "personality" ? (
        <p>Товч үр дүн үнэгүй, дэлгэрэнгүй тайлан төлбөртэй. Яг үнэ үр дүнгийн хуудсан дээр гарна.</p>
      ) : null}
      {version.kind === "stress" ? <p>Асуулга, оноо, үр дүн бүгд үнэгүй. Энэ нь онош биш.</p> : null}
      {!user || user.ageBand === "unknown" ? (
        <>
          <p>Төрсөн өдрөө нэг удаа оруулна. Таны нас хэрэглэгчийн мэдээлэлд хадгалагдаж, дараагийн тестэд дахин асуухгүй.</p>
          <AgeForm next={`/tests/${slug}/quiz`} />
        </>
      ) : null}
      {user && user.ageBand !== "unknown" && !allowed ? <p>Энэ тест таны насны бүлэгт нээлттэй биш.</p> : null}
      {allowed ? (
        <Link className="btn" href={`/tests/${slug}/quiz`}>
          {resume ? "Үргэлжлүүлэх" : "Эхлүүлэх"}
        </Link>
      ) : null}
    </main>
  );
}
