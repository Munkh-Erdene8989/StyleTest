import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNewsDate } from "@/domain/news";
import { publishedNews } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = (await publishedNews()).find((item) => item.slug === slug);
  if (!post) return { title: "Мэдээ" };
  return { title: post.title, description: post.excerpt };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = (await publishedNews()).find((item) => item.slug === slug);
  if (!post) notFound();
  return (
    <main className="article">
      <p className="kicker">
        <Link href="/news">Мэдээ, мэдээлэл</Link>
      </p>
      <span className={`article-rule swatch-${post.swatch}`} aria-hidden="true" />
      <h1>{post.title}</h1>
      <p className="row-meta">
        {post.topic}, <time dateTime={post.publishedOn}>{formatNewsDate(post.publishedOn)}</time>
      </p>
      {post.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </main>
  );
}
