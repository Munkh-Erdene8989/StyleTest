import { StudioAbout, StudioContact, StudioGallerySection, StudioHero, StudioServices, StudioStories, StudioTraining } from "@/components/studio-sections";
import { OfferCard, spreadFor, TestSpread } from "@/components/test-spread";
import { PUBLIC_NOTICE } from "@/domain/brand";
import { PRICES } from "@/domain/money";
import { optionalUser } from "@/server/auth";

export default async function HomePage() {
  const user = await optionalUser();
  const age = user?.ageBand ?? "unknown";
  const { items, under18 } = await spreadFor(age);
  const spotlight = items.find((item) => item.priceMnt === PRICES.style_package);
  const rest = spotlight ? items.filter((item) => item !== spotlight) : items;
  return (
    <main className="studio">
      <StudioHero />
      <StudioAbout />
      <StudioServices featured={spotlight ? <OfferCard item={spotlight} spotlight /> : undefined}>
        <div id="tests">
          <TestSpread items={rest} embedStyle={false} />
        </div>
        <p className="note">{PUBLIC_NOTICE}</p>
        {under18 ? <p className="note">18-аас доош насанд зурагтай стайл, төлбөртэй тайлан хаалттай.</p> : null}
      </StudioServices>
      <StudioTraining />
      <StudioGallerySection />
      <StudioStories />
      <StudioContact />
    </main>
  );
}
