import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { BodyEdgeLink } from "@/components/body-edge-link";
import { MobileDock } from "@/components/mobile-dock";
import { SiteHeader } from "@/components/site-header";
import { StudioFooterBrand, StudioFooterContact } from "@/components/studio-sections";
import { BRAND_DESCRIPTION, BRAND_KEYWORDS, resolveAppName } from "@/domain/brand";
import { operationsFrom } from "@/domain/site-operations";
import { studioFrom } from "@/domain/studio-profile";
import { storedQuizPrice } from "@/domain/money";
import { archetypeAvailable } from "@/server/ai-quiz-banks";
import { optionalUser } from "@/server/auth";
import { getStore } from "@/server/store";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: "variable",
  variable: "--font-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getStore().getSiteConfig();
  const name = resolveAppName(site.appName);
  const description = operationsFrom(site.operations).heroLede || BRAND_DESCRIPTION;
  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: {
      default: name,
      template: `%s · ${name}`,
    },
    description,
    applicationName: name,
    keywords: BRAND_KEYWORDS,
    authors: [{ name }],
    creator: name,
    openGraph: {
      type: "website",
      locale: "mn_MN",
      siteName: name,
      title: name,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getStore().getSiteConfig();
  const name = resolveAppName(site.appName);
  const studio = studioFrom(site.studio);
  const ops = operationsFrom(site.operations);
  const user = await optionalUser();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name,
    description: ops.heroLede || BRAND_DESCRIPTION,
    url: siteUrl,
    image: siteUrl ? `${siteUrl}/naruka-logo.png` : "/naruka-logo.png",
    logo: siteUrl ? `${siteUrl}/naruka-logo.png` : "/naruka-logo.png",
    telephone: studio.phone,
    email: studio.email,
    sameAs: [ops.facebook],
    address: {
      "@type": "PostalAddress",
      streetAddress: studio.address.split("\n")[0],
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
        <SiteHeader loggedIn={Boolean(user?.email)} email={user?.email ?? ""} name={name} />
        <div className="shell">{children}</div>
        <BodyEdgeLink />
        <MobileDock loggedIn={Boolean(user?.email)} archetypeReady={archetypeAvailable()} price={storedQuizPrice(site.quizPriceMnt)} />
        <footer className="foot">
          <div className="bar foot-grid">
            <StudioFooterBrand name={name} tagline={ops.footerTagline} />
            <StudioFooterContact studio={studio} ops={ops} />
          </div>
          <p className="bar foot-copy">© {new Date().getFullYear()} {name}. Бүх эрх хуулиар хамгаалагдсан. Fashion Stylist · Улаанбаатар, Монгол</p>
        </footer>
      </body>
    </html>
  );
}
