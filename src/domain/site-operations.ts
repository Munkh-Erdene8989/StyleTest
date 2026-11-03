import type { SiteGalleryItem, SiteLesson, SiteOperations, SiteSchedule, SiteService, SiteStat } from "./types";

export const DEFAULT_OPERATIONS: SiteOperations = {
  heroKicker: "✦ Улаанбаатар, City Tower",
  heroTitle: "Өөрийн өнгөөр",
  heroEmphasis: "тод гэрэлт",
  heroLede: "Мэргэжлийн өнгө тодорхойлох үйлчилгээ. Таны өвөрмөц гоо үзэсгэлэнг нээж, хэзээч өөрчлөгдөхгүй өнгөний палитрыг бүтээнэ.",
  heroAction: "Яг одоо тодорхойлох",
  heroHref: "/tests",
  stats: [
    { value: "500+", label: "Үйлчлүүлэгч" },
    { value: "4", label: "Мэргэжилтэн" },
    { value: "5★", label: "Үнэлгээ" },
  ],
  aboutImages: ["/studio/about-studio.jpg", "/studio/about-brushes.jpg", "/studio/about-portrait.jpg"],
  aboutLead: "Өнгө — таны хамгийн",
  aboutEmphasis: "хүчирхэг хэрэгсэл",
  aboutBody: [
    "Naruka Styling Studio нь Улаанбаатар хотын City Tower-т байрлах мэргэжлийн стайлинг студи юм. Бид олон улсын стандартын дагуу хувийн өнгө тодорхойлох үйлчилгээг Монгол хүний дүр төрхөнд тохируулан хэрэгжүүлдэг.",
    "Дадлага туршлагатай 4 стилистаас бүрдсэн баг нь таны арьсны өнгө, нүдний болон үсний өнгийг нарийн судлан, насан туршид хэрэглэх өнгөний системийг тодорхойлно.",
  ],
  aboutTicks: ["Мэргэжлийн алчуур (drape) ашиглана", "Олон улсын аргачлал", "Цаасан & дижитал гарын авлага", "Makeup аудит боломжтой"],
  servicesKicker: "Үйлчилгээ",
  servicesTitle: "Таны гоо үзэсгэлэнд зориулсан",
  services: [
    {
      title: "Хувийн өнгө тодорхойлох",
      subtitle: "Personal Color Analysis",
      description: "Олон улсын стандартын дагуу таны арьсны өнгө, нүдний болон үсний өнгийг судлан, насан туршид хэрэглэх өнгөний палитрыг тодорхойлно.",
      includes: ["Хувцасны өнгө & хээ", "Нүүр будалтын шийдэл", "Хумс & үсний будаг", "Гоёл чимэглэлийн өнгө", "Цаасан & дижитал гарын авлага"],
      image: "/studio/service-color.jpg",
      tag: "",
      href: "tel",
      action: "Яг одоо тодорхойлох",
    },
    {
      title: "Нүүр будалтын зөвлөгөө",
      subtitle: "Makeup Consultation",
      description: "Өөрийн makeup-аа авч ирээд, таны өнгөний системд нийцэх хэрэглэлийг мэргэжлийн стилистаас шалгуулж, өдөр тутмын будалт хийж сур.",
      includes: ["Makeup аудит", "Өнгөний тохирол шалгах", "Өдөр тутмын будалт сургах", "Оройн будалтын зөвлөмж"],
      image: "/studio/service-makeup.jpg",
      tag: "",
      href: "tel",
      action: "Яг одоо тодорхойлох",
    },
    {
      title: "Стайлинг зөвлөгөө",
      subtitle: "Styling Consultation",
      description: "Бие галбирт тохирсон хувцас, өмсгөлийн байршил, брэндийн дүр төрхийг бүтцийн аргаар шинжлэн гаргана.",
      includes: ["Биеийн гарааны шинжилгээ", "Хувцасны зохилдлого", "Брэнд дүр бүрдүүлэх", "Дэлгүүр хэсэх гарын авлага"],
      image: "/studio/service-styling.jpg",
      tag: "",
      href: "tel",
      action: "Яг одоо тодорхойлох",
    },
    {
      title: "Сэтгэлзүйн стайл тест",
      subtitle: "Style Psychology Test",
      description: "Таны хувийн шинж чанар, амьдралын хэв маяг, зорилгод нийцэх дүр төрхийг сэтгэл судлалын аргаар тодорхойлно. Тест бөглөөд тайланг и-мэйлээр авна.",
      includes: ["6 асуулт — 5 минут", "Стайл архетипийн тодорхойлолт", "Өнгөний палитрын зөвлөмж", "Хувийн стайлинг зөвлөгөө", "Тайланг и-мэйлээр авна"],
      image: "/studio/service-test.jpg",
      tag: "Онлайн",
      href: "/quiz",
      action: "Онлайн тест авах",
    },
  ],
  onlineKicker: "Шинэ — Онлайн",
  onlineTitle: "Сэтгэлзүйн стайл тест",
  onlineBody: "6 асуултаар стайл архетипаа тодорхойл — үр дүнг и-мэйлээр авна",
  onlineAction: "Тест эхлүүлэх",
  onlineHref: "/quiz",
  trainingKicker: "Мэргэжлийн анги",
  trainingTitle: "Өөрийн стайлинг",
  trainingEmphasis: "бизнесээ эхлүүл",
  trainingBody:
    "Онол, практикийг хослуулсан 2 долоо хоногийн мэргэжлийн сургалт. Хувийн өнгө тодорхойлох, makeup, стайлинг зөвлөгөөний бүх мэдлэгийг эзэмшин өөрийн үйлчилгээгээ нээх боломжтой.",
  trainingNoticeTitle: "Элсэлт хаагдах гэж байна",
  trainingStart: "9-р сарын 28",
  trainingClose: "9-р сарын 25",
  lessons: [
    { title: "Өнгөний онол", description: "Өнгөний дугуй, температур, гүн гэрэлтэй байдал, хуурмаг болон жинхэнэ өнгө" },
    { title: "Хувийн өнгө тодорхойлох", description: "Алчуур ашиглан практик тодорхойлолт, 4 улирлын систем" },
    { title: "Makeup & гоо сайхан", description: "Өнгөний системтэй нийцсэн makeup бүтээх, хэрэглэгчид зааж сургах" },
    { title: "Бизнес эрхлэлт", description: "Үйлчилгээ тогтоох, харилцагч татах, брэнд бүтээх" },
  ],
  schedule: [
    { label: "Даваа – Баасан", value: "12:00 · 3–5 цаг" },
    { label: "2 долоо хоног нийт", value: "Шинэчлэгдсэн хөтөлбөр" },
  ],
  galleryKicker: "Галерей",
  galleryTitle: "Өнгөний ертөнц",
  gallery: [
    { image: "/studio/gallery-summer.jpg", label: "Зун улирлын палитр", tall: true },
    { image: "/studio/gallery-autumn.jpg", label: "Warm Autumn", tall: false },
    { image: "/studio/gallery-winter.jpg", label: "Cool Winter", tall: true },
    { image: "/studio/gallery-spring.jpg", label: "Spring Bright", tall: false },
    { image: "/studio/gallery-soft-summer.jpg", label: "Soft Summer", tall: true },
    { image: "/studio/gallery-deep-autumn.jpg", label: "Deep Autumn", tall: false },
  ],
  facebook: "https://facebook.com/narukastylingstudio",
  mapsUrl: "https://maps.app.goo.gl/rjnJRU1CptBG6iE69",
  mapsEmbed: "https://maps.google.com/maps?q=47.9193516,106.9209513+(City+tower+business+center)&z=17&hl=mn&output=embed",
  footerTagline: "✨ Өөрийн өнгөөр тод гэрэлт ✨\nМэргэжлийн хувийн өнгө тодорхойлох үйлчилгээ. City Tower, Улаанбаатар.",
};

export function operationsFrom(input: Partial<SiteOperations> | null | undefined): SiteOperations {
  if (!input) return cloneOperations(DEFAULT_OPERATIONS);
  return cleanOperations({ ...DEFAULT_OPERATIONS, ...input });
}

export function cleanOperations(raw: unknown): SiteOperations {
  const body = asRecord(raw);
  const base = DEFAULT_OPERATIONS;
  return {
    heroKicker: clip(body.heroKicker, 80, base.heroKicker),
    heroTitle: clip(body.heroTitle, 80, base.heroTitle),
    heroEmphasis: clip(body.heroEmphasis, 80, base.heroEmphasis),
    heroLede: clip(body.heroLede, 400, base.heroLede),
    heroAction: clip(body.heroAction, 40, base.heroAction),
    heroHref: safeHref(body.heroHref, base.heroHref),
    stats: cleanStats(body.stats),
    aboutImages: cleanImages(body.aboutImages, base.aboutImages, 3),
    aboutLead: clip(body.aboutLead, 80, base.aboutLead),
    aboutEmphasis: clip(body.aboutEmphasis, 80, base.aboutEmphasis),
    aboutBody: lines(body.aboutBody, 4, 600, base.aboutBody),
    aboutTicks: lines(body.aboutTicks, 8, 120, base.aboutTicks),
    servicesKicker: clip(body.servicesKicker, 40, base.servicesKicker),
    servicesTitle: clip(body.servicesTitle, 80, base.servicesTitle),
    services: cleanServices(body.services),
    onlineKicker: clip(body.onlineKicker, 40, base.onlineKicker),
    onlineTitle: clip(body.onlineTitle, 80, base.onlineTitle),
    onlineBody: clip(body.onlineBody, 240, base.onlineBody),
    onlineAction: clip(body.onlineAction, 40, base.onlineAction),
    onlineHref: safeHref(body.onlineHref, base.onlineHref),
    trainingKicker: clip(body.trainingKicker, 40, base.trainingKicker),
    trainingTitle: clip(body.trainingTitle, 80, base.trainingTitle),
    trainingEmphasis: clip(body.trainingEmphasis, 80, base.trainingEmphasis),
    trainingBody: clip(body.trainingBody, 600, base.trainingBody),
    trainingNoticeTitle: clip(body.trainingNoticeTitle, 80, base.trainingNoticeTitle),
    trainingStart: clip(body.trainingStart, 40, base.trainingStart),
    trainingClose: clip(body.trainingClose, 40, base.trainingClose),
    lessons: cleanLessons(body.lessons),
    schedule: cleanSchedule(body.schedule),
    galleryKicker: clip(body.galleryKicker, 40, base.galleryKicker),
    galleryTitle: clip(body.galleryTitle, 80, base.galleryTitle),
    gallery: cleanGallery(body.gallery),
    facebook: safeFacebook(body.facebook),
    mapsUrl: safeMapsUrl(body.mapsUrl),
    mapsEmbed: safeEmbed(body.mapsEmbed),
    footerTagline: clip(body.footerTagline, 240, base.footerTagline, true),
  };
}

function cleanServices(raw: unknown): SiteService[] {
  if (!Array.isArray(raw)) return cloneOperations(DEFAULT_OPERATIONS).services;
  const services: SiteService[] = [];
  for (const item of raw.slice(0, 8)) {
    const body = asRecord(item);
    const title = clip(body.title, 80, "");
    if (title.length < 2) continue;
    const fallbackImage = DEFAULT_OPERATIONS.services[services.length]?.image ?? DEFAULT_OPERATIONS.services[0].image;
    services.push({
      title,
      subtitle: clip(body.subtitle, 80, ""),
      description: clip(body.description, 500, ""),
      includes: lines(body.includes, 8, 80, []),
      image: safeImage(body.image, fallbackImage),
      tag: clip(body.tag, 24, ""),
      href: safeHref(body.href, "tel"),
      action: clip(body.action, 40, "Яг одоо тодорхойлох"),
    });
  }
  return services;
}

function cleanLessons(raw: unknown): SiteLesson[] {
  if (!Array.isArray(raw)) return cloneOperations(DEFAULT_OPERATIONS).lessons;
  const lessons: SiteLesson[] = [];
  for (const item of raw.slice(0, 8)) {
    const body = asRecord(item);
    const title = clip(body.title, 80, "");
    if (title.length < 2) continue;
    lessons.push({ title, description: clip(body.description, 240, "") });
  }
  return lessons;
}

function cleanSchedule(raw: unknown): SiteSchedule[] {
  if (!Array.isArray(raw)) return cloneOperations(DEFAULT_OPERATIONS).schedule;
  const rows: SiteSchedule[] = [];
  for (const item of raw.slice(0, 6)) {
    const body = asRecord(item);
    const label = clip(body.label, 60, "");
    const value = clip(body.value, 60, "");
    if (!label || !value) continue;
    rows.push({ label, value });
  }
  return rows.length ? rows : cloneOperations(DEFAULT_OPERATIONS).schedule;
}

function cleanGallery(raw: unknown): SiteGalleryItem[] {
  if (!Array.isArray(raw)) return cloneOperations(DEFAULT_OPERATIONS).gallery;
  const items: SiteGalleryItem[] = [];
  for (const item of raw.slice(0, 12)) {
    const body = asRecord(item);
    const label = clip(body.label, 80, "");
    if (label.length < 2) continue;
    const fallback = DEFAULT_OPERATIONS.gallery[items.length]?.image ?? DEFAULT_OPERATIONS.gallery[0].image;
    items.push({ image: safeImage(body.image, fallback), label, tall: body.tall === true });
  }
  return items;
}

function cleanStats(raw: unknown): SiteStat[] {
  if (!Array.isArray(raw)) return cloneOperations(DEFAULT_OPERATIONS).stats;
  const stats: SiteStat[] = [];
  for (const item of raw.slice(0, 4)) {
    const body = asRecord(item);
    const value = clip(body.value, 12, "");
    const label = clip(body.label, 40, "");
    if (!value || !label) continue;
    stats.push({ value, label });
  }
  return stats.length ? stats : cloneOperations(DEFAULT_OPERATIONS).stats;
}

function cleanImages(raw: unknown, fallback: string[], count: number) {
  const images = Array.isArray(raw) ? raw.map((item, index) => safeImage(item, fallback[index] ?? fallback[0])).slice(0, count) : [];
  while (images.length < count) images.push(fallback[images.length] ?? fallback[0]);
  return images;
}

function lines(raw: unknown, maxItems: number, maxLen: number, fallback: string[]) {
  if (!Array.isArray(raw)) return [...fallback];
  return raw.map((item) => clip(item, maxLen, "")).filter(Boolean).slice(0, maxItems);
}

function clip(value: unknown, max: number, fallback: string, keepBreaks = false) {
  const source = typeof value === "string" ? value : "";
  const text = source.replace(keepBreaks ? /[\u0000-\u0009\u000b-\u001f]/g : /[\u0000-\u001f]/g, "").trim();
  if (!text) return fallback;
  return text.slice(0, max);
}

function safeHref(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "tel") return "tel";
  if (/^\/[a-z0-9/_-]{0,80}$/.test(text)) return text;
  return fallback === "tel" || /^\/[a-z0-9/_-]{0,80}$/.test(fallback) ? fallback : "/tests";
}

function safeImage(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (/^\/(?:studio|api\/site-media)\/[A-Za-z0-9._/-]{1,180}$/.test(text)) return text;
  return fallback;
}

function safeFacebook(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  if (/^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9._/-]{1,80}$/.test(text)) return text;
  return DEFAULT_OPERATIONS.facebook;
}

function safeMapsUrl(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  if (/^https:\/\/(maps\.app\.goo\.gl\/[A-Za-z0-9_-]+|(?:www\.)?google\.com\/maps\/\S+|maps\.google\.com\/\S+)$/.test(text)) {
    return text.slice(0, 300);
  }
  return DEFAULT_OPERATIONS.mapsUrl;
}

function safeEmbed(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  if (/^https:\/\/(?:maps\.google\.com|(?:www\.)?google\.com)\/maps(?:\/|\?)\S*$/.test(text)) return text.slice(0, 500);
  return DEFAULT_OPERATIONS.mapsEmbed;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function cloneOperations(operations: SiteOperations): SiteOperations {
  return structuredClone(operations);
}
