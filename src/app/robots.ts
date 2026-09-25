import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/reports", "/sessions", "/login", "/api", "/style"],
    },
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
