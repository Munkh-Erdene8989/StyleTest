import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Link from "next/link";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { SiteHeader } from "@/components/site-header";
import { StudioFooterBrand, StudioFooterContact } from "@/components/studio-sections";
import { BRAND_DESCRIPTION, BRAND_EMAIL, BRAND_FACEBOOK, BRAND_KEYWORDS, BRAND_NAME, BRAND_PHONE } from "@/domain/brand";
import { optionalUser } from "@/server/auth";
import { getStore } from "@/server/store";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: BRAND_NAME,
    template: `%s · ${BRAND_NAME}`,
  },
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  keywords: BRAND_KEYWORDS,
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: BRAND_NAME,
    title: BRAND_NAME,
    description: BRAND_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: BRAND_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await getStore().getSiteConfig();
  const user = await optionalUser();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    url: siteUrl,
    image: siteUrl ? `${siteUrl}/naruka-logo.png` : "/naruka-logo.png",
    logo: siteUrl ? `${siteUrl}/naruka-logo.png` : "/naruka-logo.png",
    telephone: BRAND_PHONE,
    email: BRAND_EMAIL,
    sameAs: [BRAND_FACEBOOK],
    address: {
      "@type": "PostalAddress",
      streetAddress: "City Tower, 20-р давхар, 2002 тоот",
      addressLocality: "Улаанбаатар",
      postalCode: "14200",
      addressCountry: "MN",
    },
    areaServed: "MN",
    inLanguage: "mn",
  };
  return (
    <html lang="mn">
      <body className={`${manrope.className} ${cormorant.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <AuthBootstrap />
        <SiteHeader loggedIn={Boolean(user?.email)} email={user?.email ?? ""} />
        <div className="shell">{children}</div>
        <footer className="foot">
          <div className="bar foot-grid">
            <StudioFooterBrand />
            <div>
              <p className="foot-label">Хуудас</p>
              <nav className="foot-links">
                <Link href="/#about">Бидний тухай</Link>
                <Link href="/#services">Үйлчилгээ</Link>
                <Link href="/#training">Сургалт</Link>
                <Link href="/#gallery">Галерей</Link>
                <Link href="/#stories">Сэтгэгдэл</Link>
                <Link href="/#contact">Холбоо барих</Link>
                <Link href="/news">Мэдээ</Link>
                <Link href="/account">Миний хэсэг</Link>
                <Link href="/privacy">Нууцлал</Link>
                <Link href="/terms">Үйлчилгээний нөхцөл</Link>
                <Link href="/login">{user?.email ? "Нэвтэрсэн" : "Нэвтрэх"}</Link>
              </nav>
            </div>
            <StudioFooterContact />
          </div>
          <p className="bar foot-copy">© 2024 Naruka Styling Studio. Бүх эрх хуулиар хамгаалагдсан. Fashion Stylist · Улаанбаатар, Монгол</p>
        </footer>
      </body>
    </html>
  );
}
