import type { ReactNode } from "react";
import Link from "next/link";
import { StudioGallery } from "@/components/studio-gallery";
import type { SiteOperations, StudioProfile } from "@/domain/types";

function actionHref(href: string, phone: string) {
  if (href === "tel") return `tel:${phone.replace(/\s/g, "")}`;
  return href;
}

function SiteAction({ href, phone, className, children }: { href: string; phone: string; className: string; children: ReactNode }) {
  const target = actionHref(href, phone);
  if (target.startsWith("/") && !target.startsWith("//")) {
    return (
      <Link className={className} href={target}>
        {children}
      </Link>
    );
  }
  return (
    <a className={className} href={target}>
      {children}
    </a>
  );
}

export function StudioHero({ studio, ops }: { studio: StudioProfile; ops: SiteOperations }) {
  return (
    <section className="stage" id="home">
      <img className="stage-photo" src={studio.headerImage} alt="" />
      <div className="stage-shade" />
      <div className="stage-copy">
        <p className="kicker">{ops.heroKicker}</p>
        <h1>
          {ops.heroTitle}
          <br />
          <em>{ops.heroEmphasis}</em>
        </h1>
        <p className="stage-lede">{ops.heroLede}</p>
        <div className="stage-actions">
          <SiteAction href={ops.heroHref} phone={studio.phone} className="btn">
            {ops.heroAction}
          </SiteAction>
        </div>
      </div>
      <div className="stage-stats">
        {ops.stats.map((stat) => (
          <div key={`${stat.value}-${stat.label}`}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StudioAbout({ studio, ops }: { studio: StudioProfile; ops: SiteOperations }) {
  return (
    <section className="band" id="about">
      <div className="bar">
        <div className="studio-split">
          <div className="collage">
            {ops.aboutImages.map((image, index) => (
              <img key={`${image}-${index}`} src={image} alt="" />
            ))}
          </div>
          <div className="studio-copy">
            <p className="kicker">Бидний тухай</p>
            <h2>
              {ops.aboutLead}
              <br />
              <em>{ops.aboutEmphasis}</em>
            </h2>
            {ops.aboutBody.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <ul className="ticks">
              {ops.aboutTicks.map((item) => (
                <li key={item}>{item}</li>
              ))}
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

export function StudioServices({ studio, ops, featured, children }: { studio: StudioProfile; ops: SiteOperations; featured?: ReactNode; children?: ReactNode }) {
  return (
    <section className="band band-sand" id="services">
      <div className="bar">
        <div className="band-head">
          <p className="kicker">{ops.servicesKicker}</p>
          <h2>{ops.servicesTitle}</h2>
        </div>
        <div className="spread">
          {featured}
          {ops.services.map((service) => (
            <article key={service.title} className="panel panel-feature">
              <div className="panel-photo">
                <img src={service.image} alt="" />
                {service.tag ? <span className="tag">{service.tag} — Онлайн</span> : null}
              </div>
              <div className="panel-copy">
                <p className="kicker">{service.subtitle}</p>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <ul className="ticks">
                  {service.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <SiteAction href={service.href} phone={studio.phone} className="btn">
                  {service.action}
                </SiteAction>
              </div>
            </article>
          ))}
        </div>
        <div className="callout">
          <div>
            <p className="kicker">{ops.onlineKicker}</p>
            <h2>{ops.onlineTitle}</h2>
            <p>{ops.onlineBody}</p>
          </div>
          <SiteAction href={ops.onlineHref} phone={studio.phone} className="btn btn-gold">
            {ops.onlineAction}
          </SiteAction>
        </div>
        {children}
      </div>
    </section>
  );
}

export function StudioTraining({ studio, ops }: { studio: StudioProfile; ops: SiteOperations }) {
  return (
    <section className="band band-wine" id="training">
      <div className="bar wine">
        <div className="wine-copy">
          <p className="kicker">{ops.trainingKicker}</p>
          <h2>
            {ops.trainingTitle}
            <br />
            <em>{ops.trainingEmphasis}</em>
          </h2>
          <p>{ops.trainingBody}</p>
          <div className="notice">
            <p>{ops.trainingNoticeTitle}</p>
            <p>
              Эхлэх огноо: <strong>{ops.trainingStart}</strong>. Элсэлт <strong>{ops.trainingClose}</strong>-нд хаагдана. Бүртгэлийн утас: <strong>{studio.phone}</strong>
            </p>
          </div>
          <a className="btn btn-gold" href={`tel:${studio.phone.replace(/\s/g, "")}`}>
            Бүртгэлийн утас руу залгах
          </a>
        </div>
        <div>
          <ol className="steps">
            {ops.lessons.map((lesson, index) => (
              <li key={`${lesson.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{lesson.title}</strong>
                  <small>{lesson.description}</small>
                </div>
              </li>
            ))}
          </ol>
          <div className="schedule">
            <p className="kicker">Хуваарь</p>
            {ops.schedule.map((row) => (
              <p key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StudioGallerySection({ ops }: { ops: SiteOperations }) {
  return (
    <section className="band" id="gallery">
      <div className="bar">
        <div className="band-head">
          <p className="kicker">{ops.galleryKicker}</p>
          <h2>{ops.galleryTitle}</h2>
        </div>
        <StudioGallery items={ops.gallery} />
      </div>
    </section>
  );
}

export function StudioStories({ studio, ops }: { studio: StudioProfile; ops: SiteOperations }) {
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
          <a className="btn-quiet" href={ops.facebook} target="_blank" rel="noopener noreferrer">
            Facebook дээрх сэтгэгдэл
          </a>
        </div>
      </div>
    </section>
  );
}

export function StudioContact({ studio, ops }: { studio: StudioProfile; ops: SiteOperations }) {
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
              <a className="btn-quiet" href={ops.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </div>
          </article>
        </div>
        <div className="contact-close">
          <div className="map-frame">
            <iframe src={ops.mapsEmbed} title="Naruka Studio байршил" loading="lazy" tabIndex={-1} />
            <a className="map-hit" href={ops.mapsUrl} target="_blank" rel="noopener noreferrer">
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

export function StudioFooterBrand({ name, tagline }: { name: string; tagline: string }) {
  const lines = tagline.split("\n").filter(Boolean);
  return (
    <div>
      <img className="foot-logo" src="/naruka-logo.png" alt={name} />
      <p>
        {lines.map((line, index) => (
          <span key={`${index}-${line}`}>
            {index > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

export function StudioFooterContact({ studio, ops }: { studio: StudioProfile; ops: SiteOperations }) {
  return (
    <div>
      <p className="foot-label">Холбоо</p>
      <nav className="foot-links">
        <a href={`tel:${studio.phone.replace(/\s/g, "")}`}>{studio.phone}</a>
        <a href={`mailto:${studio.email}`}>{studio.email}</a>
        <a href={ops.facebook} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
        <a href={ops.mapsUrl} target="_blank" rel="noopener noreferrer">
          {studio.address.split("\n")[0]}
        </a>
      </nav>
    </div>
  );
}
