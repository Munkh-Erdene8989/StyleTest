import { AgeForm } from "@/components/age-form";
import { CatalogRow } from "@/components/catalog-row";
import { optionalUser } from "@/server/auth";
import { testsForAge } from "@/server/catalog";

export default async function TestsPage() {
  const user = await optionalUser();
  if (!user || user.ageBand === "unknown") {
    return (
      <main>
        <h1>Тест</h1>
        <p>Эхлээд төрсөн өдрөө оруулна уу.</p>
        <AgeForm />
      </main>
    );
  }
  const tests = await testsForAge(user.ageBand);
  return (
    <main>
      <h1>Тест</h1>
      {tests.length === 0 ? <p>Одоогоор нээлттэй тест алга. Дараа дахин шалгана уу.</p> : null}
      <div className="catalog">
        {tests.map(({ test, version }) => (
          <CatalogRow key={test.id} href={`/tests/${test.slug}`} kind={test.kind} title={version.title} meta={`${version.minutes} минут`} />
        ))}
      </div>
    </main>
  );
}
