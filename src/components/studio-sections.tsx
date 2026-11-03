import type { ReactNode } from "react";
import Link from "next/link";
import { StudioGallery } from "@/components/studio-gallery";
import type { StudioProfile } from "@/domain/types";

const PHONE = "86106616";
const FACEBOOK = "https://facebook.com/narukastylingstudio";
const MAPS_URL = "https://maps.app.goo.gl/rjnJRU1CptBG6iE69";
const MAPS_EMBED = "https://maps.google.com/maps?q=47.9193516,106.9209513+(City+tower+business+center)&z=17&hl=mn&output=embed";

const SERVICES = [
  {
    title: "Хувийн өнгө тодорхойлох",
    subtitle: "Personal Color Analysis",
    desc: "Олон улсын стандартын дагуу таны арьсны өнгө, нүдний болон үсний өнгийг судлан, насан туршид хэрэглэх өнгөний палитрыг тодорхойлно.",
    includes: ["Хувцасны өнгө & хээ", "Нүүр будалтын шийдэл", "Хумс & үсний будаг", "Гоёл чимэглэлийн өнгө", "Цаасан & дижитал гарын авлага"],
    img: "/studio/service-color.jpg",
    tag: null,
    href: `tel:${PHONE}`,
    action: "Яг одоо тодорхойлох",
  },
  {
    title: "Нүүр будалтын зөвлөгөө",
    subtitle: "Makeup Consultation",
    desc: "Өөрийн makeup-аа авч ирээд, таны өнгөний системд нийцэх хэрэглэлийг мэргэжлийн стилистаас шалгуулж, өдөр тутмын будалт хийж сур.",
    includes: ["Makeup аудит", "Өнгөний тохирол шалгах", "Өдөр тутмын будалт сургах", "Оройн будалтын зөвлөмж"],
    img: "/studio/service-makeup.jpg",
    tag: null,
    href: `tel:${PHONE}`,
    action: "Яг одоо тодорхойлох",
  },
  {
    title: "Стайлинг зөвлөгөө",
    subtitle: "Styling Consultation",
    desc: "Бие галбирт тохирсон хувцас, өмсгөлийн байршил, брэндийн дүр төрхийг бүтцийн аргаар шинжлэн гаргана.",
    includes: ["Биеийн гарааны шинжилгээ", "Хувцасны зохилдлого", "Брэнд дүр бүрдүүлэх", "Дэлгүүр хэсэх гарын авлага"],
    img: "/studio/service-styling.jpg",
    tag: null,
    href: `tel:${PHONE}`,
    action: "Яг одоо тодорхойлох",
  },
  {
    title: "Сэтгэлзүйн стайл тест",
    subtitle: "Style Psychology Test",
    desc: "Таны хувийн шинж чанар, амьдралын хэв маяг, зорилгод нийцэх дүр төрхийг сэтгэл судлалын аргаар тодорхойлно. Тест бөглөөд тайланг и-мэйлээр авна.",
    includes: ["6 асуулт — 5 минут", "Стайл архетипийн тодорхойлолт", "Өнгөний палитрын зөвлөмж", "Хувийн стайлинг зөвлөгөө", "Тайланг и-мэйлээр авна"],
    img: "/studio/service-test.jpg",
    tag: "Онлайн",
    href: "/quiz",
    action: "Онлайн тест авах",
  },
];

const LESSONS = [
  { n: "01", title: "Өнгөний онол", desc: "Өнгөний дугуй, температур, гүн гэрэлтэй байдал, хуурмаг болон жинхэнэ өнгө" },
  { n: "02", title: "Хувийн өнгө тодорхойлох", desc: "Алчуур ашиглан практик тодорхойлолт, 4 улирлын систем" },
  { n: "03", title: "Makeup & гоо сайхан", desc: "Өнгөний системтэй нийцсэн makeup бүтээх, хэрэглэгчид зааж сургах" },
  { n: "04", title: "Бизнес эрхлэлт", desc: "Үйлчилгээ тогтоох, харилцагч татах, брэнд бүтээх" },
];

export function StudioHero({ studio }: { studio: StudioProfile }) {
  return (
    <section className="stage" id="home">
      <img className="stage-photo" src={studio.headerImage} alt="" />
      <div className="stage-shade" />
      <div className="stage-copy">
        <p className="kicker">✦ Улаанбаатар, City Tower</p>
        <h1>
          Өөрийн өнгөөр
          <br />
          <em>тод гэрэлт</em>
        </h1>
        <p className="stage-lede">
          Мэргэжлийн өнгө тодорхойлох үйлчилгээ. Таны өвөрмөц гоо үзэсгэлэнг нээж, хэзээч өөрчлөгдөхгүй өнгөний палитрыг бүтээнэ.
        </p>
        <div className="stage-actions">
          <Link className="btn" href="/tests">
            Яг одоо тодорхойлох
          </Link>
        </div>
      </div>
      <div className="stage-stats">
        <div>
          <strong>500+</strong>
          <span>Үйлчлүүлэгч</span>
        </div>
        <div>
          <strong>4</strong>
          <span>Мэргэжилтэн</span>
        </div>
        <div>
          <strong>5★</strong>
          <span>Үнэлгээ</span>
        </div>
      </div>
    </section>
  );
}

export function StudioAbout({ studio }: { studio: StudioProfile }) {
  return (
    <section className="band" id="about">
      <div className="bar">
        <div className="studio-split">
          <div className="collage">
            <img src="/studio/about-studio.jpg" alt="" />
            <img src="/studio/about-brushes.jpg" alt="" />
            <img src="/studio/about-portrait.jpg" alt="" />
          </div>
          <div className="studio-copy">
            <p className="kicker">Бидний тухай</p>
            <h2>
              Өнгө — таны хамгийн
              <br />
              <em>хүчирхэг хэрэгсэл</em>
            </h2>
            <p>
              Naruka Styling Studio нь Улаанбаатар хотын City Tower-т байрлах мэргэжлийн стайлинг студи юм. Бид олон улсын стандартын дагуу хувийн өнгө тодорхойлох үйлчилгээг Монгол хүний дүр төрхөнд тохируулан хэрэгжүүлдэг.
            </p>
            <p>
              Дадлага туршлагатай 4 стилистаас бүрдсэн баг нь таны арьсны өнгө, нүдний болон үсний өнгийг нарийн судлан, насан туршид хэрэглэх өнгөний системийг тодорхойлно.
            </p>
            <ul className="ticks">
              <li>Мэргэжлийн алчуур (drape) ашиглана</li>
              <li>Олон улсын аргачлал</li>
              <li>Цаасан & дижитал гарын авлага</li>
              <li>Makeup аудит боломжтой</li>
            </ul>
          </div>
        </div>
        <div className="team-head">
          <p className="kicker">Манай баг</p>
          <h2>Таны өнгийг нээх мэргэжилтнүүд</h2>
        </div>
        <div className="team">
          {studio.team.map((member) => (
            <figure key={`${member.name}-${member.image}`}>
              <img src={member.image} alt="" />
              <figcaption>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StudioServices({ studio, featured, children }: { studio: StudioProfile; featured?: ReactNode; children?: ReactNode }) {
  return (
    <section className="band band-sand" id="services">
      <div className="bar">
        <div className="band-head">
          <p className="kicker">Үйлчилгээ</p>
          <h2>Таны гоо үзэсгэлэнд зориулсан</h2>
        </div>
        <div className="spread">
          {featured}
          {SERVICES.map((service) => (
            <article key={service.title} className="panel panel-feature">
              <div className="panel-photo">
                <img src={service.img} alt="" />
                {service.tag ? <span className="tag">{service.tag} — Онлайн</span> : null}
              </div>
              <div className="panel-copy">
                <p className="kicker">{service.subtitle}</p>
                <h2>{service.title}</h2>
                <p>{service.desc}</p>
                <ul className="ticks">
                  {service.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a className="btn" href={service.href.startsWith("tel:") ? `tel:${studio.phone.replace(/\s/g, "")}` : service.href}>
                  {service.action}
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="callout">
          <div>
            <p className="kicker">Шинэ — Онлайн</p>
            <h2>Сэтгэлзүйн стайл тест</h2>
            <p>6 асуултаар стайл архетипаа тодорхойл — үр дүнг и-мэйлээр авна</p>
          </div>
          <Link className="btn btn-gold" href="/quiz">
            Тест эхлүүлэх
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}

export function StudioTraining({ studio }: { studio: StudioProfile }) {
  return (
    <section className="band band-wine" id="training">
      <div className="bar wine">
        <div className="wine-copy">
          <p className="kicker">Мэргэжлийн анги</p>
          <h2>
            Өөрийн стайлинг
            <br />
            <em>бизнесээ эхлүүл</em>
          </h2>
          <p>
            Онол, практикийг хослуулсан 2 долоо хоногийн мэргэжлийн сургалт. Хувийн өнгө тодорхойлох, makeup, стайлинг зөвлөгөөний бүх мэдлэгийг эзэмшин өөрийн үйлчилгээгээ нээх боломжтой.
          </p>
          <div className="notice">
            <p>Элсэлт хаагдах гэж байна</p>
            <p>
              Эхлэх огноо: <strong>9-р сарын 28</strong>. Элсэлт <strong>9-р сарын 25</strong>-нд хаагдана. Бүртгэлийн утас: <strong>{studio.phone}</strong>
            </p>
          </div>
          <a className="btn btn-gold" href={`tel:${studio.phone.replace(/\s/g, "")}`}>
            Бүртгэлийн утас руу залгах
          </a>
        </div>
        <div>
          <ol className="steps">
            {LESSONS.map((lesson) => (
              <li key={lesson.n}>
                <span>{lesson.n}</span>
                <div>
                  <strong>{lesson.title}</strong>
                  <small>{lesson.desc}</small>
                </div>
              </li>
            ))}
          </ol>
          <div className="schedule">
            <p className="kicker">Хуваарь</p>
            <p>
              <span>Даваа – Баасан</span>
              <strong>12:00 · 3–5 цаг</strong>
            </p>
            <p>
              <span>2 долоо хоног нийт</span>
              <strong>Шинэчлэгдсэн хөтөлбөр</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StudioGallerySection() {
  return (
    <section className="band" id="gallery">
      <div className="bar">
        <div className="band-head">
          <p className="kicker">Галерей</p>
          <h2>Өнгөний ертөнц</h2>
        </div>
        <StudioGallery />
      </div>
    </section>
  );
}

export function StudioStories({ studio }: { studio: StudioProfile }) {
  return (
    <section className="band band-sand" id="stories">
      <div className="bar">
        <div className="band-head">
          <p className="kicker">Сэтгэгдэл</p>
          <h2>Үйлчлүүлэгчдийн хэлсэн үг</h2>
        </div>
        <div className="quotes">
          {studio.reviews.map((item) => (
            <article key={`${item.name}-${item.text}`} className="quote">
              <p className="stars" aria-label="5 од">
                ★★★★★
              </p>
              <p>“{item.text}”</p>
              <footer>
                <strong>{item.name}</strong>
                <span>{item.tag}</span>
              </footer>
            </article>
          ))}
        </div>
        <div className="link-row">
          <a className="btn-quiet" href={FACEBOOK} target="_blank" rel="noopener noreferrer">
            Facebook дээрх сэтгэгдэл
          </a>
        </div>
      </div>
    </section>
  );
}

export function StudioContact({ studio }: { studio: StudioProfile }) {
  return (
    <section className="band" id="contact">
      <div className="bar">
        <div className="band-head">
          <p className="kicker">Холбоо барих</p>
          <h2>Бидэнтэй холбогдох</h2>
        </div>
        <div className="contact-grid">
          <article className="contact-card">
            <h3>Байршил</h3>
            <p>
              {studio.address.split("\n").map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </article>
          <article className="contact-card">
            <h3>Утас</h3>
            <p>Цаг захиалга, сургалтын бүртгэл</p>
            <a className="btn" href={`tel:${studio.phone.replace(/\s/g, "")}`}>
              {studio.phone}
            </a>
          </article>
          <article className="contact-card">
            <h3>И-мэйл & Сошиал</h3>
            <div className="link-row">
              <a className="btn-quiet" href={`mailto:${studio.email}`}>
                {studio.email}
              </a>
              <a className="btn-quiet" href={FACEBOOK} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </div>
          </article>
        </div>
        <div className="contact-close">
          <div className="map-frame">
            <iframe src={MAPS_EMBED} title="Naruka Studio байршил" loading="lazy" tabIndex={-1} />
            <a className="map-hit" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <span>Google Maps дээр нээх</span>
            </a>
          </div>
          <article className="contact-cta">
            <p className="kicker">Яг одоо тодорхойлох</p>
            <h2>
              Өнгөний аяллаа
              <br />
              <em>өнөөдөр эхлүүл</em>
            </h2>
            <p>Насан туршид хэрэглэх өнгөний системийг нэг удаа тодорхойлоод хувцас, makeup, гоёл чимэглэл бүгдийг зөв сонгох болно.</p>
            <a className="btn btn-gold" href={`tel:${studio.phone.replace(/\s/g, "")}`}>
              Яг одоо тодорхойлох
            </a>
          </article>
        </div>
        <div className="link-row">
          <Link className="btn" href="/login">
            Нэвтрэх
          </Link>
          <Link className="btn-quiet" href="/account">
            Миний хэсэг
          </Link>
          <Link className="btn-quiet" href="/privacy">
            Нууцлал
          </Link>
        </div>
      </div>
    </section>
  );
}

export function StudioFooterBrand() {
  return (
    <div>
      <img className="foot-logo" src="/naruka-logo.png" alt="Naruka Styling Studio" />
      <p>
        ✨ Өөрийн өнгөөр тод гэрэлт ✨
        <br />
        Мэргэжлийн хувийн өнгө тодорхойлох үйлчилгээ. City Tower, Улаанбаатар.
      </p>
    </div>
  );
}

export function StudioFooterContact({ studio }: { studio: StudioProfile }) {
  return (
    <div>
      <p className="foot-label">Холбоо</p>
      <nav className="foot-links">
        <a href={`tel:${studio.phone.replace(/\s/g, "")}`}>{studio.phone}</a>
        <a href={`mailto:${studio.email}`}>{studio.email}</a>
        <a href={FACEBOOK} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
        <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
          {studio.address.split("\n")[0]}
        </a>
      </nav>
    </div>
  );
}
