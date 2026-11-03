import type { MetadataRoute } from "next";
import { listedOnSite } from "@/domain/admin-content";
import { NEWS_POSTS } from "@/domain/news";
import { loadCatalog, publishedNews } from "@/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  let newsPaths = NEWS_POSTS.map((post) => `/news/${post.slug}`);
  let catalogPaths: string[] = [];
  try {
    newsPaths = (await publishedNews()).map((post) => `/news/${post.slug}`);
    catalogPaths = (await loadCatalog()).filter((row) => listedOnSite(row)).map((row) => `/tests/${row.test.slug}/quiz`);
  } catch {
    newsPaths = NEWS_POSTS.map((post) => `/news/${post.slug}`);
  }
  const paths = ["", "/quiz", "/tests", "/tests/face", "/tests/body", "/tests/archetype", "/news", "/privacy", "/terms", ...catalogPaths, ...newsPaths];
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/news/") ? 0.6 : 0.7,
  }));
}
