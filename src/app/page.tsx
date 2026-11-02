import { StudioAbout, StudioContact, StudioGallerySection, StudioHero, StudioServices, StudioStories, StudioTraining } from "@/components/studio-sections";
import { studioFrom } from "@/domain/studio-profile";
import { getStore } from "@/server/store";

export default async function HomePage() {
  const studio = studioFrom((await getStore().getSiteConfig()).studio);
  return (
    <main className="studio">
      <StudioHero studio={studio} />
      <StudioAbout studio={studio} />
      <StudioServices studio={studio} />
      <StudioTraining studio={studio} />
      <StudioGallerySection />
      <StudioStories studio={studio} />
      <StudioContact studio={studio} />
    </main>
  );
}
