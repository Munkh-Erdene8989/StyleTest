import { notFound } from "next/navigation";
import { ResultLive } from "@/components/result-live";
import { AppError } from "@/domain/errors";
import { optionalUser } from "@/server/auth";
import { present } from "@/server/result-service";
import { getStore } from "@/server/store";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await optionalUser();
  if (!user) notFound();
  try {
    const result = await present(user, id);
    const site = await getStore().getSiteConfig();
    return (
      <main>
        <ResultLive initial={result} appName={site.appName} email={user.email} />
      </main>
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  }
}
