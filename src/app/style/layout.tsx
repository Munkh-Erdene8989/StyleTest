import type { Metadata } from "next";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = noIndex;

export default function StyleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
