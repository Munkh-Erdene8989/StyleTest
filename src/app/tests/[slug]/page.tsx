import Link from "next/link";
import { notFound } from "next/navigation";
import { canStartTest } from "@/domain/age";
import { getTestBySlug } from "@/domain/content";
import { optionalUser } from "@/server/auth";
import { effectiveVersion } from "@/server/catalog";
import { resumeSession } from "@/server/session-service";

export default async function TestIntroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const test = getTestBySlug(slug);
  if (!test) notFound();
  const version = await effectiveVersion(test.activeVersionId);
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
      {!user || user.ageBand === "unknown" ? <p>Эхлээд нүүр хуудаснаас төрсөн өдрөө оруулна уу.</p> : null}
      {user && user.ageBand !== "unknown" && !allowed ? <p>Энэ тест таны насны бүлэгт нээлттэй биш.</p> : null}
      {allowed ? (
        <Link className="btn" href={`/tests/${slug}/quiz`}>
          {resume ? "Үргэлжлүүлэх" : "Эхлүүлэх"}
        </Link>
      ) : null}
    </main>
  );
}
