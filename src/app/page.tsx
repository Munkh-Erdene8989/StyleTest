import { StudioAbout, StudioContact, StudioGallerySection, StudioHero, StudioServices, StudioStories, StudioTraining } from "@/components/studio-sections";

export default function HomePage() {
  return (
    <main className="studio">
      <StudioHero />
      <StudioAbout />
      <StudioServices />
      <StudioTraining />
      <StudioGallerySection />
      <StudioStories />
      <StudioContact />
    </main>
  );
}
