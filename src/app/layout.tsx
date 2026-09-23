import type { Metadata } from "next";
import { Onest, Unbounded } from "next/font/google";
import Link from "next/link";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { optionalUser } from "@/server/auth";
import { getStore } from "@/server/store";
import "./globals.css";

const onest = Onest({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  weight: ["500"],
  variable: "--font-display",
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
      <body className={`${onest.className} ${unbounded.variable}`}>
        <AuthBootstrap />
        <div className="shell">
          <header className="top">
            <Link href="/" className="wordmark">
              {site.appName}
            </Link>
            <nav className="nav">
              <Link href="/tests">Тест</Link>
              {user?.ageBand === "adult" ? <Link href="/style">Стайл</Link> : null}
              <Link href="/account">Миний хэсэг</Link>
              <Link href="/login">{user?.email ? "Нэвтэрсэн" : "Нэвтрэх"}</Link>
            </nav>
          </header>
          {children}
          <footer className="foot">
            <Link href="/privacy">Нууцлал</Link>
            <Link href="/terms">Үйлчилгээний нөхцөл</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
