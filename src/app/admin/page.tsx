import { AdminPanel } from "@/components/admin-panel";

export default function AdminPage() {
  return (
    <main className="grid gap-4">
      <h1 className="text-2xl font-semibold">Админ</h1>
      <AdminPanel />
    </main>
  );
}
