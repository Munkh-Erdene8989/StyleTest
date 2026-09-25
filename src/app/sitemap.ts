import type { MetadataRoute } from "next";
import { TESTS } from "@/domain/content";
import { NEWS_POSTS } from "@/domain/news";
import { loadCatalog, publishedNews } from "@/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  let testPaths = TESTS.map((test) => `/tests/${test.slug}`);
  let newsPaths = NEWS_POSTS.map((post) => `/news/${post.slug}`);
  try {
    testPaths = (await loadCatalog()).filter((row) => !row.hidden).map((row) => `/tests/${row.test.slug}`);
    newsPaths = (await publishedNews()).map((post) => `/news/${post.slug}`);
  } catch {
    testPaths = TESTS.map((test) => `/tests/${test.slug}`);
  }
  const paths = ["", "/tests", "/news", "/privacy", "/terms", ...testPaths, ...newsPaths];
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/news/") || path.startsWith("/tests/") ? 0.6 : 0.7,
  }));
}
