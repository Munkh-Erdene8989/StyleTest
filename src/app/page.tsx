import { AgeForm } from "@/components/age-form";
import { CatalogRow } from "@/components/catalog-row";
import { optionalUser } from "@/server/auth";
import { testsForAge } from "@/server/catalog";

export default async function HomePage() {
  const user = await optionalUser();
  const tests = user ? await testsForAge(user.ageBand) : [];
  const ready = Boolean(user && user.ageBand !== "unknown");
  return (
    <main>
      {ready ? (
        <>
          <h1>Юу хийх вэ</h1>
          {tests.length === 0 ? <p>Танд нээлттэй тест алга. Дараа дахин шалгана уу.</p> : null}
          <div className="catalog">
            {tests.map(({ test, version }) => (
              <CatalogRow
                key={test.id}
                href={`/tests/${test.slug}`}
                kind={test.kind}
                title={version.title}
                meta={`${version.minutes} минут`}
              />
            ))}
            {user?.ageBand === "adult" ? (
              <CatalogRow href="/style" kind="style" title="Стайлын зөвлөмж" meta="Товч чиглэл үнэгүй. Бүтэн багц 19,000₮." />
            ) : (
              <p className="note">18-аас доош насанд зурагтай стайл, төлбөртэй тайлан хаалттай.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <header className="hero">
            <h1>Өөрийгөө таньж, хувцсаа сонго.</h1>
            <p className="lede">
              Монгол хэл дээрх асуулга, стрессийн өөрийн тэмдэглэл, хөгжилтэй тест. Насанд хүрэгчдэд хувцасны чиглэл.
            </p>
          </header>
          <AgeForm />
        </>
      )}
    </main>
  );
}
