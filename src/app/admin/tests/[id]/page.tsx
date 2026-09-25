import { TestBuilder } from "@/components/admin/test-builder";

export default async function AdminTestEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return <TestBuilder id={id} from={query.from ?? ""} />;
}
