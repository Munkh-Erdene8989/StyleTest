import { StudioAbout, StudioContact, StudioGallerySection, StudioHero, StudioServices, StudioStories, StudioTraining } from "@/components/studio-sections";
import { operationsFrom } from "@/domain/site-operations";
import { studioFrom } from "@/domain/studio-profile";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getStore().getSiteConfig();
  const studio = studioFrom(site.studio);
  const ops = operationsFrom(site.operations);
  return (
    <main className="studio">
      <StudioHero studio={studio} ops={ops} />
      <StudioAbout studio={studio} ops={ops} />
      <StudioServices studio={studio} ops={ops} />
      <StudioTraining studio={studio} ops={ops} />
      <StudioGallerySection ops={ops} />
      <StudioStories studio={studio} ops={ops} />
      <StudioContact studio={studio} ops={ops} />
    </main>
  );
}
