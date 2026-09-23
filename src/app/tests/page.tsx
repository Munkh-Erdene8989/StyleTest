import Link from "next/link";
import { AgeForm } from "@/components/age-form";
import { optionalUser } from "@/server/auth";
import { testsForAge } from "@/server/catalog";

export default async function TestsPage() {
  const user = await optionalUser();
  if (!user || user.ageBand === "unknown") {
    return (
      <main className="grid gap-4">
        <h1 className="text-2xl font-semibold">Тестийн каталог</h1>
        <p>Эхлээд төрсөн өдрөө оруулна уу.</p>
        <AgeForm />
      </main>
    );
  }
  const tests = await testsForAge(user.ageBand);
  return (
    <main className="grid gap-3">
      <h1 className="text-2xl font-semibold">Тестийн каталог</h1>
      {tests.length === 0 ? <p>Одоогоор нээлттэй тест алга.</p> : null}
      {tests.map(({ test, version }) => (
        <Link key={test.id} href={`/tests/${test.slug}`} className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium">{version.title}</h2>
          <p>{version.minutes} минут</p>
        </Link>
      ))}
    </main>
  );
}
