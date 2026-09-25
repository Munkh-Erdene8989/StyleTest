import { AgeForm } from "@/components/age-form";
import { StudioAbout, StudioContact, StudioGallerySection, StudioHero, StudioServices, StudioStories, StudioTraining } from "@/components/studio-sections";
import { OfferCard, spreadFor, TestSpread } from "@/components/test-spread";
import { PRICES } from "@/domain/money";
import { optionalUser } from "@/server/auth";

export default async function HomePage() {
  const user = await optionalUser();
  const age = user?.ageBand ?? "unknown";
  const { items, locked, under18 } = await spreadFor(age, "/#start");
  const spotlight = items.find((item) => item.priceMnt === PRICES.style_package);
  const rest = spotlight ? items.filter((item) => item !== spotlight) : items;
  return (
    <main className="studio">
      <StudioHero />
      <StudioAbout />
      <StudioServices featured={spotlight ? <OfferCard item={spotlight} spotlight /> : undefined}>
        <div id="start" className="spread-note">
          {locked ? <AgeForm /> : <p className="note">Нас тохируулсан. Доорх тестүүд танд нээлттэй.</p>}
        </div>
        <div id="tests">
          <TestSpread items={rest} embedStyle={false} />
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
