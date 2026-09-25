import type { Metadata } from "next";
import Link from "next/link";
import { formatNewsDate, NEWS_POSTS } from "@/domain/news";

export const metadata: Metadata = {
  title: "Мэдээ, мэдээлэл",
  description: "Эмэгтэйчүүд болон загвар сонирхогчдод зориулсан энэ улирлын загварын чиглэл.",
};

export default function NewsPage() {
  return (
    <main className="news-index">
      <p className="kicker">Мэдээ, мэдээлэл</p>
      <h1>
        Энэ улирлын <em>чиглэл</em>
      </h1>
      <p className="lede">
        Эмэгтэйчүүд болон загвар сонирхогчдод зориулсан энэ улирлын чиглэл. Дэлгүүр, үнэ байхгүй. Өмсөх арга л байна.
      </p>
      <div className="news-grid">
        {NEWS_POSTS.map((post) => (
          <Link key={post.slug} href={`/news/${post.slug}`} className="news-card">
            <span className={`news-band swatch-${post.swatch}`} aria-hidden="true" />
            <span className="news-card-body">
              <span className="kicker">{post.topic}</span>
              <span className="news-title">{post.title}</span>
              <span className="news-excerpt">{post.excerpt}</span>
              <time className="row-meta" dateTime={post.publishedOn}>
                {formatNewsDate(post.publishedOn)}
              </time>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
