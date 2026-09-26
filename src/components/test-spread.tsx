import Link from "next/link";
import { PRICES } from "@/domain/money";
import { formatMnt } from "@/lib/format";
import { testsForAge } from "@/server/catalog";
import type { AgeBand, MethodologyVersion, TestDefinition, TestKind } from "@/domain/types";

const FACES: Record<TestKind, { kicker: string; image: string }> = {
  personality: {
    kicker: "Өөрийгөө таних",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=900&fit=crop&auto=format",
  },
  stress: {
    kicker: "Ачааллын тэмдэглэл",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=900&fit=crop&auto=format",
  },
  fun: {
    kicker: "Хөгжилтэй",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=900&fit=crop&auto=format",
  },
  youth: {
    kicker: "18-аас доош",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=900&fit=crop&auto=format",
  },
  style: {
    kicker: "Хувцас",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=900&fit=crop&auto=format",
  },
};

export type SpreadItem = {
  href: string;
  kind: TestKind;
  kicker: string;
  title: string;
  description: string;
  points: string[];
  image: string;
  action: string;
  badge: string;
  priceMnt: number;
};

export async function spreadFor(age: AgeBand) {
  const preview: AgeBand = age === "unknown" ? "adult" : age;
  const tests = await testsForAge(preview);
  const items: SpreadItem[] = tests.map(({ test, version }) => toItem(test, version));
  if (preview === "adult") {
    items.push({
      kind: "style",
      href: "/style",
      kicker: FACES.style.kicker,
      title: "Стайлын зөвлөмж",
      description: `Товч чиглэл үнэгүй. Бүтэн багц зурагтай, ${formatMnt(PRICES.style_package)}₮.`,
      points: ["Гурван алхам", "Өнгө, силуэт, тух", "Зурагтай багц насанд хүрэгчдэд"],
      image: FACES.style.image,
      action: "Эхлүүлэх",
      badge: `${formatMnt(PRICES.style_package)}₮`,
      priceMnt: PRICES.style_package,
    });
  }
  return { items, under18: age === "under18" };
}

function toItem(test: TestDefinition, version: MethodologyVersion): SpreadItem {
  const face = FACES[version.kind];
  const points = [`${version.questions.length} асуулт`, `${version.minutes} минут`];
  if (test.priceMnt > 0) {
    points.push("Товч үр дүн үнэгүй");
    points.push(`Дэлгэрэнгүй тайлан ${test.priceMnt.toLocaleString("mn-MN")}₮`);
  } else {
    points.push("Үр дүн үнэгүй");
  }
  return {
    href: `/tests/${test.slug}`,
    kind: version.kind,
    kicker: face.kicker,
    title: version.title,
    description: version.description,
    points,
    image: face.image,
    action: "Эхлүүлэх",
    badge: test.priceMnt > 0 ? `${test.priceMnt.toLocaleString("mn-MN")}₮` : "Үнэгүй",
    priceMnt: test.priceMnt,
  };
}

export function TestSpread({ items, embedStyle = true }: { items: SpreadItem[]; embedStyle?: boolean }) {
  const feature = items.find((item) => item.kind !== "style") ?? items[0];
  const tiles = items.filter((item) => item !== feature && item.kind !== "style");
  const style = items.find((item) => item.kind === "style");
  if (!feature) return <p>Танд нээлттэй тест алга. Дараа дахин шалгана уу.</p>;
  return (
    <div className="spread">
      <Panel item={feature} featured />
      {tiles.length > 0 ? (
        <div className="spread-grid">
          {tiles.map((item) => (
            <Panel key={item.kind} item={item} />
          ))}
        </div>
      ) : null}
      {embedStyle && style ? <StyleBand item={style} /> : null}
    </div>
  );
}

export function OfferCard({ item, spotlight = false }: { item: SpreadItem; spotlight?: boolean }) {
  return <Panel item={item} featured spotlight={spotlight} />;
}

function Panel({ item, featured = false, spotlight = false }: { item: SpreadItem; featured?: boolean; spotlight?: boolean }) {
  return (
    <article className={featured ? `panel panel-feature${spotlight ? " panel-spotlight" : ""}` : "tile"}>
      <div className="panel-photo">
        <img src={item.image} alt="" />
        <span className="tag">{item.badge}</span>
      </div>
      <div className="panel-copy">
        <p className="kicker">{item.kicker}</p>
        <h2>{item.title}</h2>
        {spotlight && item.priceMnt > 0 ? <p className="price">{formatMnt(item.priceMnt)}₮</p> : null}
        <p>{item.description}</p>
        <ul className="ticks">
          {item.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <Link className="btn" href={item.href}>
          {item.action}
        </Link>
      </div>
    </article>
  );
}

function StyleBand({ item }: { item: SpreadItem }) {
  return (
    <section className="wine">
      <div className="wine-copy">
        <p className="kicker">{item.kicker}</p>
        <h2>
          Хувцасны чиглэлээ <em>эхлүүл</em>
        </h2>
        <p>{item.description}</p>
        <Link className="btn btn-gold" href={item.href}>
          {item.action}
        </Link>
      </div>
      <ol className="steps">
        {item.points.map((point, index) => (
          <li key={point}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{point}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
