import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import Link from "next/link";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { optionalUser } from "@/server/auth";
import { getStore } from "@/server/store";
import "./globals.css";

const noto = Noto_Sans({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getStore().getSiteConfig();
  return { title: site.appName, description: "Монгол хэл дээрх тест ба стайлын зөвлөмж" };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getStore().getSiteConfig();
  const user = await optionalUser();
  return (
    <html lang="mn">
      <body className={`${noto.className} antialiased`}>
        <AuthBootstrap />
        <div className="mx-auto min-h-screen max-w-3xl px-4 py-5">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="text-lg font-semibold">
              {site.appName}
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm">
              <Link href="/tests">Тест</Link>
              {user?.ageBand === "adult" ? <Link href="/style">Стайл</Link> : null}
              <Link href="/account">Миний хэсэг</Link>
              <Link href="/login">{user?.email ? "Нэвтэрсэн" : "Нэвтрэх"}</Link>
            </nav>
          </header>
          {children}
          <footer className="mt-10 flex gap-4 border-t border-stone-200 pt-4 text-sm text-stone-600">
            <Link href="/privacy">Нууцлал</Link>
            <Link href="/terms">Үйлчилгээний нөхцөл</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
