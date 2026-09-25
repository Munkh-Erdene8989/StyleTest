import type { Metadata } from "next";
import { AdminFrame } from "@/components/admin/admin-frame";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = noIndex;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      <AdminFrame>{children}</AdminFrame>
    </div>
  );
}
