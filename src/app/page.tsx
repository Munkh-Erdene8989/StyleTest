import Link from "next/link";
import { AgeForm } from "@/components/age-form";
import { optionalUser } from "@/server/auth";
import { testsForAge } from "@/server/catalog";
import { getStore } from "@/server/store";

export default async function HomePage() {
  const site = await getStore().getSiteConfig();
  const user = await optionalUser();
  const tests = user ? await testsForAge(user.ageBand) : [];
  return (
    <main className="grid gap-6">
      <section className="grid gap-3">
        <h1 className="text-3xl font-semibold leading-tight">{site.appName}</h1>
        <p>Монгол хэл дээр өөрийгөө таних, стрессийн өөрийн үнэлгээ, хөгжилтэй тест, хувийн стайлын зөвлөмж.</p>
      </section>
      {!user || user.ageBand === "unknown" ? <AgeForm /> : null}
      {user && user.ageBand !== "unknown" ? (
        <section className="grid gap-3">
          {tests.map(({ test, version }) => (
            <Link key={test.id} href={`/tests/${test.slug}`} className="rounded-2xl border border-stone-200 bg-white p-4">
              <h2 className="font-medium">{version.title}</h2>
              <p className="text-stone-600">{version.description}</p>
            </Link>
          ))}
          {user.ageBand === "adult" ? (
            <Link href="/style" className="rounded-2xl border border-stone-200 bg-white p-4">
              <h2 className="font-medium">AI стайлын зөвлөмж</h2>
              <p className="text-stone-600">Товч чиглэл үнэгүй. Бүтэн багц 19,000₮.</p>
            </Link>
          ) : (
            <p className="rounded-2xl bg-white p-4 text-stone-600">18-аас доош насанд зурагтай стайл, төлбөртэй тайлан хаалттай.</p>
          )}
          {tests.length === 0 ? <p>Танд нээлттэй тест алга.</p> : null}
        </section>
      ) : null}
    </main>
  );
}
