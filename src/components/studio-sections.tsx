import type { ReactNode } from "react";
import Link from "next/link";
import { StudioGallery } from "@/components/studio-gallery";

const PHONE = "86106616";
const PHONE_LABEL = "8610 6616";
const EMAIL = "naruka.stylingstudio@gmail.com";
const FACEBOOK = "https://facebook.com/narukastylingstudio";

const SERVICES = [
  {
    title: "Хувийн өнгө тодорхойлох",
    subtitle: "Personal Color Analysis",
    desc: "Олон улсын стандартын дагуу таны арьсны өнгө, нүдний болон үсний өнгийг судлан, насан туршид хэрэглэх өнгөний палитрыг тодорхойлно.",
    includes: ["Хувцасны өнгө & хээ", "Нүүр будалтын шийдэл", "Хумс & үсний будаг", "Гоёл чимэглэлийн өнгө", "Цаасан & дижитал гарын авлага"],
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=900&fit=crop&auto=format",
    tag: null,
    href: `tel:${PHONE}`,
    action: "Яг одоо тодорхойлох",
  },
  {
    title: "Нүүр будалтын зөвлөгөө",
    subtitle: "Makeup Consultation",
    desc: "Өөрийн makeup-аа авч ирээд, таны өнгөний системд нийцэх хэрэглэлийг мэргэжлийн стилистаас шалгуулж, өдөр тутмын будалт хийж сур.",
    includes: ["Makeup аудит", "Өнгөний тохирол шалгах", "Өдөр тутмын будалт сургах", "Оройн будалтын зөвлөмж"],
    img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&h=900&fit=crop&auto=format",
    tag: null,
    href: `tel:${PHONE}`,
    action: "Яг одоо тодорхойлох",
  },
  {
    title: "Стайлинг зөвлөгөө",
    subtitle: "Styling Consultation",
    desc: "Бие галбирт тохирсон хувцас, өмсгөлийн байршил, брэндийн дүр төрхийг бүтцийн аргаар шинжлэн гаргана.",
    includes: ["Биеийн гарааны шинжилгээ", "Хувцасны зохилдлого", "Брэнд дүр бүрдүүлэх", "Дэлгүүр хэсэх гарын авлага"],
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=900&fit=crop&auto=format",
    tag: null,
    href: `tel:${PHONE}`,
    action: "Яг одоо тодорхойлох",
  },
  {
    title: "Сэтгэлзүйн стайл тест",
    subtitle: "Style Psychology Test",
    desc: "Таны хувийн шинж чанар, амьдралын хэв маяг, зорилгод нийцэх дүр төрхийг сэтгэл судлалын аргаар тодорхойлно. Тест бөглөөд тайланг и-мэйлээр авна.",
    includes: ["6 асуулт — 5 минут", "Стайл архетипийн тодорхойлолт", "Өнгөний палитрын зөвлөмж", "Хувийн стайлинг зөвлөгөө", "Тайланг и-мэйлээр авна"],
    img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=900&fit=crop&auto=format",
    tag: "Онлайн",
    href: "#tests",
    action: "Онлайн тест авах",
  },
];

const TEAM = [
  { name: "Naruka", role: "Үндэслэгч & Ахлах Стилист", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=640&fit=crop&auto=format" },
  { name: "Билгүүн", role: "Өнгө шинжлэгч", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=640&fit=crop&auto=format" },
  { name: "Номин", role: "Makeup Artist & Стилист", img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&h=640&fit=crop&auto=format" },
  { name: "Энхцэцэг", role: "Стайлинг зөвлөх", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=640&fit=crop&auto=format" },
];

const TESTIMONIALS = [
  { name: "Мөнхцэцэг Б.", text: "Naruka Studio-д очсоноос хойш хувцасаа огт буруу сонгохоо болилоо. Өнгөний анализ хийлгэсэн нь миний амьдралд хийсэн шилдэг хөрөнгө оруулалт байлаа.", palette: "Warm Autumn" },
  { name: "Оюунцэцэг Д.", text: "Гэрэлтэй, цэмцгэр орчинд мэргэжлийн баг маш нягт нямбай тодорхойлсон. Палитрын гарын авлага нь одоо болтол гар утаснаасаа хэзээ ч хаядаггүй.", palette: "Cool Winter" },
  { name: "Энхжаргал С.", text: "Мэргэжлийн ангид суусан. 2 долоо хоногийн хичээл их нягт агуулгатай байсан. Одоо өөрийн студи нээх замдаа яваа.", palette: "Мэргэжлийн анги" },
  { name: "Нарантуяа Ж.", text: "Би makeup-аа авчирч шалгуулсан. Аль хэрэглэл зохохгүй байгааг ойлгосон нь их хэмнэлттэй боллоо. Зөвлөгөө маш тодорхой, ойлгомжтой байлаа.", palette: "Soft Summer" },
];

const LESSONS = [
  { n: "01", title: "Өнгөний онол", desc: "Өнгөний дугуй, температур, гүн гэрэлтэй байдал, хуурмаг болон жинхэнэ өнгө" },
  { n: "02", title: "Хувийн өнгө тодорхойлох", desc: "Алчуур ашиглан практик тодорхойлолт, 4 улирлын систем" },
  { n: "03", title: "Makeup & гоо сайхан", desc: "Өнгөний системтэй нийцсэн makeup бүтээх, хэрэглэгчид зааж сургах" },
  { n: "04", title: "Бизнес эрхлэлт", desc: "Үйлчилгээ тогтоох, харилцагч татах, брэнд бүтээх" },
];

export function StudioHero() {
  return (
    <section className="stage" id="home">
      <img className="stage-photo" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1800&h=1100&fit=crop&auto=format" alt="" />
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
          <a className="btn" href={`tel:${PHONE}`}>
            Яг одоо тодорхойлох
          </a>
          <a className="btn-ghost" href="#tests">
            Стайл тест авах
          </a>
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

export function StudioAbout() {
  return (
    <section className="band" id="about">
      <div className="bar">
        <div className="studio-split">
          <div className="collage">
            <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&h=600&fit=crop&auto=format" alt="" />
            <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=400&fit=crop&auto=format" alt="" />
            <img src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=500&h=400&fit=crop&auto=format" alt="" />
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
          {TEAM.map((member) => (
            <figure key={member.name}>
              <img src={member.img} alt="" />
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

export function StudioServices({ featured, children }: { featured?: ReactNode; children: ReactNode }) {
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
                <a className="btn" href={service.href}>
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
          <a className="btn btn-gold" href="#tests">
            Тест эхлүүлэх
          </a>
        </div>
        {children}
      </div>
    </section>
  );
}

export function StudioTraining() {
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
              Эхлэх огноо: <strong>9-р сарын 28</strong>. Элсэлт <strong>9-р сарын 25</strong>-нд хаагдана. Бүртгэлийн утас: <strong>{PHONE_LABEL}</strong>
            </p>
          </div>
          <a className="btn btn-gold" href={`tel:${PHONE}`}>
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

export function StudioStories() {
  return (
    <section className="band band-sand" id="stories">
      <div className="bar">
        <div className="band-head">
          <p className="kicker">Сэтгэгдэл</p>
          <h2>Үйлчлүүлэгчдийн хэлсэн үг</h2>
        </div>
        <div className="quotes">
          {TESTIMONIALS.map((item) => (
            <article key={item.name} className="quote">
              <p className="stars" aria-label="5 од">
                ★★★★★
              </p>
              <p>“{item.text}”</p>
              <footer>
                <strong>{item.name}</strong>
                <span>{item.palette}</span>
              </footer>
            </article>
          ))}
        </div>
        <p className="spread-note band-head">
          <a className="inline-link" href={FACEBOOK} target="_blank" rel="noopener noreferrer">
            Facebook дээр дэлгэрэнгүй сэтгэгдэл үзэх — 8.1K дагагч
          </a>
        </p>
      </div>
    </section>
  );
}

export function StudioContact() {
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
              City Tower, 20-р давхар, 2002 тоот
              <br />
              Талбайн зүүн тал
              <br />
              Улаанбаатар 14200
            </p>
          </article>
          <article className="contact-card">
            <h3>Утас</h3>
            <p>
              <a className="inline-link" href={`tel:${PHONE}`}>
                {PHONE_LABEL}
              </a>
            </p>
            <p>Цаг захиалга, сургалтын бүртгэл</p>
          </article>
          <article className="contact-card">
            <h3>И-мэйл & Сошиал</h3>
            <p>
              <a className="inline-link" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </p>
            <p>
              <a className="inline-link" href={FACEBOOK} target="_blank" rel="noopener noreferrer">
                Facebook · 8.1K дагагч
              </a>
            </p>
          </article>
        </div>
        <div className="contact-close">
          <div className="map-frame">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2673.5!2d106.9057!3d47.9077!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5d96924e21a0e0b5%3A0x123456!2sCity+Tower%2C+Ulaanbaatar!5e0!3m2!1sen!2smn!4v1695000000000!5m2!1sen!2smn"
              title="Naruka Studio байршил"
              loading="lazy"
            />
          </div>
          <article className="contact-cta">
            <p className="kicker">Яг одоо тодорхойлох</p>
            <h2>
              Өнгөний аяллаа
              <br />
              <em>өнөөдөр эхлүүл</em>
            </h2>
            <p>Насан туршид хэрэглэх өнгөний системийг нэг удаа тодорхойлоод хувцас, makeup, гоёл чимэглэл бүгдийг зөв сонгох болно.</p>
            <a className="btn btn-gold" href={`tel:${PHONE}`}>
              Яг одоо тодорхойлох
            </a>
          </article>
        </div>
        <p className="spread-note">
          <Link className="inline-link" href="/login">
            Нэвтрэх
          </Link>
          {" · "}
          <Link className="inline-link" href="/account">
            Миний хэсэг
          </Link>
          {" · "}
          <Link className="inline-link" href="/privacy">
            Нууцлал
          </Link>
        </p>
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

export function StudioFooterContact() {
  return (
    <div>
      <p className="foot-label">Холбоо</p>
      <nav className="foot-links">
        <a href={`tel:${PHONE}`}>{PHONE_LABEL}</a>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <a href={FACEBOOK} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
        <span>City Tower 20F · 2002 тоот</span>
      </nav>
    </div>
  );
}
