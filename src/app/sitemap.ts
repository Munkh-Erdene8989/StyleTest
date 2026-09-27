import type { MetadataRoute } from "next";
import { NEWS_POSTS } from "@/domain/news";
import { publishedNews } from "@/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  let newsPaths = NEWS_POSTS.map((post) => `/news/${post.slug}`);
  try {
    newsPaths = (await publishedNews()).map((post) => `/news/${post.slug}`);
  } catch {
    newsPaths = NEWS_POSTS.map((post) => `/news/${post.slug}`);
  }
  const paths = ["", "/quiz", "/news", "/privacy", "/terms", ...newsPaths];
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/news/") ? 0.6 : 0.7,
  }));
}
