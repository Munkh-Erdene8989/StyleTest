import type { StudioProfile } from "./types";

export const DEFAULT_STUDIO: StudioProfile = {
  headerImage: "/studio/hero.jpg",
  phone: "86106616",
  email: "naruka.stylingstudio@gmail.com",
  address: "City Tower, 20-р давхар, 2002 тоот\nТалбайн зүүн тал\nУлаанбаатар 14200",
  team: [
    { name: "Naruka", role: "Үндэслэгч & Ахлах Стилист", image: "/studio/team-naruka.jpg" },
    { name: "Билгүүн", role: "Өнгө шинжлэгч", image: "/studio/team-bilguun.jpg" },
    { name: "Номин", role: "Makeup Artist & Стилист", image: "/studio/team-nomin.jpg" },
    { name: "Энхцэцэг", role: "Стайлинг зөвлөх", image: "/studio/team-enkhtsetseg.jpg" },
  ],
  reviews: [
    { name: "Мөнхцэцэг Б.", text: "Naruka Studio-д очсоноос хойш хувцасаа огт буруу сонгохоо болилоо. Өнгөний анализ хийлгэсэн нь миний амьдралд хийсэн шилдэг хөрөнгө оруулалт байлаа.", tag: "Warm Autumn" },
    { name: "Оюунцэцэг Д.", text: "Гэрэлтэй, цэмцгэр орчинд мэргэжлийн баг маш нягт нямбай тодорхойлсон. Палитрын гарын авлага нь одоо болтол гар утаснаасаа хэзээ ч хаядаггүй.", tag: "Cool Winter" },
    { name: "Энхжаргал С.", text: "Мэргэжлийн ангид суусан. 2 долоо хоногийн хичээл их нягт агуулгатай байсан. Одоо өөрийн студи нээх замдаа яваа.", tag: "Мэргэжлийн анги" },
    { name: "Нарантуяа Ж.", text: "Би makeup-аа авчирч шалгуулсан. Аль хэрэглэл зохохгүй байгааг ойлгосон нь их хэмнэлттэй боллоо. Зөвлөгөө маш тодорхой, ойлгомжтой байлаа.", tag: "Soft Summer" },
  ],
};

export function studioFrom(studio: StudioProfile | undefined | null): StudioProfile {
  if (!studio) return DEFAULT_STUDIO;
  return {
    headerImage: studio.headerImage?.trim() || DEFAULT_STUDIO.headerImage,
    phone: studio.phone?.trim() || DEFAULT_STUDIO.phone,
    email: studio.email?.trim() || DEFAULT_STUDIO.email,
    address: studio.address?.trim() || DEFAULT_STUDIO.address,
    team: Array.isArray(studio.team) ? studio.team : DEFAULT_STUDIO.team,
    reviews: Array.isArray(studio.reviews) ? studio.reviews : DEFAULT_STUDIO.reviews,
  };
}
