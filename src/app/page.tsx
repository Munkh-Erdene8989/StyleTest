import { AgeForm } from "@/components/age-form";
import { StudioAbout, StudioContact, StudioGallerySection, StudioHero, StudioServices, StudioStories, StudioTraining } from "@/components/studio-sections";
import { spreadFor, TestSpread } from "@/components/test-spread";
import { optionalUser } from "@/server/auth";

export default async function HomePage() {
  const user = await optionalUser();
  const age = user?.ageBand ?? "unknown";
  const { items, locked, under18 } = await spreadFor(age, "/#start");
  return (
    <main className="studio">
      <StudioHero />
      <StudioAbout />
      <StudioServices>
        <div id="start" className="spread-note">
          {locked ? <AgeForm /> : <p className="note">Нас тохируулсан. Доорх тестүүд танд нээлттэй.</p>}
        </div>
        <div id="tests">
          <TestSpread items={items} embedStyle={false} />
        </div>
        {under18 ? <p className="note">18-аас доош насанд зурагтай стайл, төлбөртэй тайлан хаалттай.</p> : null}
      </StudioServices>
      <StudioTraining />
      <StudioGallerySection />
      <StudioStories />
      <StudioContact />
    </main>
  );
}
