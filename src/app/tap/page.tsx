import type { Metadata } from "next";
import { TapWizard } from "@/components/tap-studio";
import { TAP_PRICE_MNT } from "@/domain/tap";
import { formatMnt } from "@/lib/format";
import { optionalUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "1 TAP",
    description: `Нүүрний зураг, нүүрний бичлэгээр Larson нүүр ба биеийн 2 хуудастай тайлан. ${formatMnt(TAP_PRICE_MNT)}₮.`,
  };
}

export default async function TapPage() {
  const user = await optionalUser();
  return (
    <main className="tap-page">
      <TapWizard email={user?.email ?? ""} />
    </main>
  );
}
