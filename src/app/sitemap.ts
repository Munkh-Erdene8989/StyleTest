import type { MetadataRoute } from "next";
import { TESTS } from "@/domain/content";
import { NEWS_POSTS } from "@/domain/news";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const paths = [
    "",
    "/tests",
    "/news",
    "/privacy",
    "/terms",
    ...TESTS.map((test) => `/tests/${test.slug}`),
    ...NEWS_POSTS.map((post) => `/news/${post.slug}`),
  ];
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/news/") || path.startsWith("/tests/") ? 0.6 : 0.7,
  }));
}
