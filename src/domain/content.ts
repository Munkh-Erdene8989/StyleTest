import { PRICES } from "./money";
import type { MethodologyVersion, StyleDirection, StyleExample, TestDefinition } from "./types";

const personalityOutline = [
  "Зан төлөвийн тайлбар",
  "Давуу тал",
  "Анзаарах хэв маяг",
  "Өдөр тутмын жишээ",
];

export const VERSIONS: MethodologyVersion[] = [
  {
    id: "personality-demo-v1",
    testId: "personality-demo",
    version: 1,
    status: "demo",
    locale: "mn",
    translationReview: "none",
    licenseRef: null,
    title: "Өөрийгөө таних үзүүлэх асуулга",
    description:
      "Энэ нь лицензтэй, баталгаажсан хэмжүүр биш. Оноо тогтсон дүрмээр гарч, AI оноог өөрчлөхгүй. Бүрэн хувилбар 10–15 минут үргэлжилнэ.",
    minutes: 8,
    minAge: 18,
    maxAge: null,
    kind: "personality",
    disclaimer:
      "Үзүүлэх агуулга. Баталгаажсан сэтгэл зүйн үнэлгээ биш, онош биш. Товч үр дүн үнэгүй, дэлгэрэнгүй тайлан төлбөртэй.",
    questions: [
      q("p1", "Шинэ ажил эхлэхэд та эхлээд юу хийдэг вэ?", [
        ["a", "Товч төлөвлөгөө гаргана", 2],
        ["b", "Хэн нэгнээс асууж эхэлнэ", 1],
        ["c", "Эхлээд ажиглана", 0],
      ]),
      q("p2", "Чөлөөт орой тань ихэвчлэн ямар байдаг вэ?", [
        ["a", "Хүмүүстэй уулзана", 2],
        ["b", "Гэртээ тайван өнгөрөөнө", 0],
        ["c", "Аль аль нь болно", 1],
      ]),
      q("p3", "Шийдвэр ойрхон байхад та яах вэ?", [
        ["a", "Хурдан сонгоод засна", 2],
        ["b", "Хэдэн хувилбар харьцуулна", 1],
        ["c", "Итгэлтэй болтол хүлээнэ", 0],
      ]),
      q("p4", "Багийн ажилд таны байр суурь аль нь вэ?", [
        ["a", "Чиглэл санал болгоно", 2],
        ["b", "Хүн бүрийн оролцоог тэнцүүлнэ", 1],
        ["c", "Өгсөн хэсгээ нямбай хийнэ", 0],
      ]),
      q("p5", "Төлөвлөгөө өөрчлөгдвөл та ямар мэдрэмжтэй байдаг вэ?", [
        ["a", "Шинэ боломж гэж хардаг", 2],
        ["b", "Товч дахин зохицуулдаг", 1],
        ["c", "Хуучин төлөвлөгөөгөө илүүд үздэг", 0],
      ]),
      q("p6", "Санал зөрөлдөхөд та юу хийдэг вэ?", [
        ["a", "Шууд хэлдэг", 2],
        ["b", "Эхлээд сонсоод дараа нь хэлдэг", 1],
        ["c", "Түр азнадаг", 0],
      ]),
      q("p7", "Амжилтаа та хэрхэн анзаардаг вэ?", [
        ["a", "Шинэ зүйл эхлүүлсэн үедээ", 2],
        ["b", "Хүмүүс хоорондоо зохицсон үедээ", 1],
        ["c", "Ажлаа дуусгасан үедээ", 0],
      ]),
      q("p8", "Өглөөний цаг тань ямар хэмнэлтэй вэ?", [
        ["a", "Олон зүйлийг зэрэг эхлүүлдэг", 2],
        ["b", "Нэг жагсаалтаар явдаг", 1],
        ["c", "Нэг л чухал ажлаа эхэлдэг", 0],
      ]),
    ],
    bands: [
      band("steady", 0, 5, "Тайван ажиглагч", "Та эхлээд ажиглаж, дараа нь тогтвортой алхам хийдэг.", [
        "Та яарч шийдэхээс илүү нягталж харахыг илүүд үздэг.",
        "Тайван хэмнэл таны ажлын чанарыг барьдаг.",
      ], personalityOutline),
      band("balance", 6, 11, "Тогтвортой зохицуулагч", "Та хүмүүс, хугацаа, ажлыг хооронд нь тэнцвэржүүлдэг.", [
        "Та хэдэн талыг харьцуулж байж алхдаг.",
        "Өдөр тутмын зохицуулалт танд илүү ойр.",
      ], personalityOutline),
      band("spark", 12, 16, "Шуурхай санаачлагч", "Та шинэ алхам, шууд яриа, хурдан эхлэлийг илүүд үздэг.", [
        "Та эхлүүлэх эрчтэй.",
        "Хурдан шийдвэрийнхээ дараа засах хэрэг гарч болно.",
      ], personalityOutline),
    ],
  },
  {
    id: "stress-demo-v1",
    testId: "stress-demo",
    version: 1,
    status: "demo",
    locale: "mn",
    translationReview: "none",
    licenseRef: null,
    title: "Стрессийн үзүүлэх өөрийн үнэлгээ",
    description:
      "Энэ нь клиник хэмжүүрийн орчуулга биш. Сүүлийн 7 хоногийн мэдрэмжээ өөрөө тэмдэглэх үзүүлэх асуулга. Үр дүн бүгд үнэгүй.",
    minutes: 5,
    minAge: 18,
    maxAge: null,
    kind: "stress",
    disclaimer: "Энэ үр дүн онош биш. Эмч, сэтгэл зүйчийн дүгнэлтийг орлохгүй.",
    questions: [
      q("s1", "Сүүлийн 7 хоногт ажил эсвэл хичээлийн ачааллаа хэр хүнд мэдэрсэн бэ?", likert()),
      q("s2", "Сүүлийн 7 хоногт амрах цаг хэр бага байсан бэ?", likert()),
      q("s3", "Сүүлийн 7 хоногт санаа зовох бодол хэр давтагдсан бэ?", likert()),
      q("s4", "Сүүлийн 7 хоногт нойр тань хэр тааруу байсан бэ?", likert()),
      q("s5", "Сүүлийн 7 хоногт бие тань хэр ядарсан байсан бэ?", likert()),
      q("s6", "Сүүлийн 7 хоногт өдөр тутмын ажлаа хэр хүндээр эхлүүлсэн бэ?", likert()),
    ],
    bands: [
      band("low", 0, 6, "Ачаалал бага байна", "Сүүлийн 7 хоногт таны тэмдэглэсэн ачаалал бага түвшинд байна.", [
        "Энэ нь онош биш, зөвхөн таны өөрийн тэмдэглэл.",
        "Унтах, завсарлага, хөдөлгөөнөө хэвээр хадгалах нь тохиромжтой.",
      ], []),
      band("mid", 7, 12, "Ачаалал дунд байна", "Сүүлийн 7 хоногт зарим өдөр ачаалал мэдрэгдсэн байна.", [
        "Энэ нь онош биш.",
        "Нэг өдөрт богино завсарлага, тогтмол унтах цагийг туршиж болно.",
        "Хүндэрвэл мэргэжлийн хүнтэй ярих нь зөв.",
      ], []),
      band("high", 13, 18, "Ачаалал өндөр мэдрэгдэж байна", "Сүүлийн 7 хоногт та ачааллыг ойр ойрхон тэмдэглэсэн байна.", [
        "Энэ нь онош биш, яаралтай тусламжийн үнэлгээ биш.",
        "Итгэдэг хүн, эмч, эсвэл доорх баталгаажсан холбоо барих сувгаар холбогдож болно.",
        "Тусламжийн мэдээлэл төлбөрийн ард байхгүй.",
      ], []),
    ],
  },
  {
    id: "fun-demo-v1",
    testId: "fun-demo",
    version: 1,
    status: "demo",
    locale: "mn",
    translationReview: "none",
    licenseRef: null,
    title: "Амралтын хэмнэл",
    description: "Хөгжилтэй богино тест. Шинжлэх ухааны үнэлгээ биш. Үр дүн, хуваалцах зураг үнэгүй.",
    minutes: 3,
    minAge: 0,
    maxAge: null,
    kind: "fun",
    disclaimer: "Энэ бол хөгжилтэй тест. Зан төлөв, эрүүл мэндийн дүгнэлт биш.",
    questions: [
      q("f1", "Амралтын өглөө та юу сонгох вэ?", [
        ["a", "Гадуур алхана", 2],
        ["b", "Ном эсвэл кино", 1],
        ["c", "Найзуудтайгаа уулзана", 0],
      ]),
      q("f2", "Цай, кофеноос аль нь илүү ойр вэ?", [
        ["a", "Халуун цай", 1],
        ["b", "Хүйтэн ундаа", 2],
        ["c", "Аль нь ч яахав", 0],
      ]),
      q("f3", "Жижиг бэлэг сонговол?", [
        ["a", "Цэцэг", 1],
        ["b", "Дуртай хөгжим", 2],
        ["c", "Гар хийцийн зүйл", 0],
      ]),
      q("f4", "Бороотой өдөр тань ямар өнгөтэй вэ?", [
        ["a", "Ногоон", 1],
        ["b", "Шар", 2],
        ["c", "Цэнхэр", 0],
      ]),
    ],
    bands: [
      band("calm", 0, 2, "Тайван булан", "Та нам гүм, дулаан өдрийг илүүд үздэг.", ["Хөгжилтэй үр дүн."], []),
      band("bright", 3, 5, "Нарлаг төлөвлөгч", "Та хөнгөн, тод өнгийг илүүд үздэг.", ["Хөгжилтэй үр дүн."], []),
      band("social", 6, 8, "Уулзалтын хүн", "Та хүмүүстэй өнгөрөх цагийг илүүд үздэг.", ["Хөгжилтэй үр дүн."], []),
    ],
  },
  {
    id: "youth-demo-v1",
    testId: "youth-demo",
    version: 1,
    status: "demo",
    locale: "mn",
    translationReview: "none",
    licenseRef: null,
    title: "Надад ойр өдөр",
    description: "18-аас доош насныханд зориулсан богино, насанд тохирсон өөрийгөө таних асуулга. Онош биш.",
    minutes: 4,
    minAge: 0,
    maxAge: 17,
    kind: "youth",
    disclaimer: "Энэ бол насанд тохирсон хөгжилтэй өөрийгөө таних асуулга. Эмчилгээ, онош биш.",
    questions: [
      q("y1", "Шинэ зүйл сурахдаа юу илүү таалагддаг вэ?", [
        ["a", "Зураг, жишээ харах", 0],
        ["b", "Өөрөө туршиж үзэх", 2],
        ["c", "Хэн нэгэн тайлбарлах", 1],
      ]),
      q("y2", "Чөлөөт цагаараа юу хийх дуртай вэ?", [
        ["a", "Зурах, бүтээх", 1],
        ["b", "Тоглох, хөдлөх", 2],
        ["c", "Унших, тайван суух", 0],
      ]),
      q("y3", "Найздаа туслахдаа аль нь ойр вэ?", [
        ["a", "Хамт хийж өгөх", 2],
        ["b", "Сонсох", 0],
        ["c", "Санаа хэлэх", 1],
      ]),
      q("y4", "Даалгавар их байвал юу тус болдог вэ?", [
        ["a", "Жагсаалт гаргах", 1],
        ["b", "Богино завсарлага авах", 2],
        ["c", "Нэг нэгээр нь хийх", 0],
      ]),
      q("y5", "Баярлах үедээ юу хийдэг вэ?", [
        ["a", "Хүнд хэлдэг", 2],
        ["b", "Инээмсэглээд өнгөрдөг", 1],
        ["c", "Дуртай зүйлээ хийдэг", 0],
      ]),
    ],
    bands: [
      band("maker", 0, 3, "Бүтээгч", "Та харах, бүтээх, тайван алхмыг илүүд үздэг.", ["Насанд тохирсон товч тайлбар."], []),
      band("helper", 4, 7, "Хамтрагч", "Та сонсох, хамт хийх, санаа хэлэхийг хослуулдаг.", ["Насанд тохирсон товч тайлбар."], []),
      band("mover", 8, 10, "Туршигч", "Та хөдөлж, туршиж, хурдан эхлүүлэхийг илүүд үздэг.", ["Насанд тохирсон товч тайлбар."], []),
    ],
  },
];

export const TESTS: TestDefinition[] = [
  { id: "personality-demo", slug: "personality", kind: "personality", activeVersionId: "personality-demo-v1", priceMnt: PRICES.personality_report, productCode: "personality_report" },
  { id: "stress-demo", slug: "stress", kind: "stress", activeVersionId: "stress-demo-v1", priceMnt: 0, productCode: null },
  { id: "fun-demo", slug: "fun", kind: "fun", activeVersionId: "fun-demo-v1", priceMnt: 0, productCode: null },
  { id: "youth-demo", slug: "youth", kind: "youth", activeVersionId: "youth-demo-v1", priceMnt: 0, productCode: null },
];

export const STYLE_DIRECTIONS: StyleDirection[] = [
  { id: "quiet-tailored", title: "Тайван шулуун", paletteFamily: "neutral", silhouette: "straight", formality: "smart", patternDensity: "low", reasonHint: "Шулуун эсгүүр, нам өнгө, эмх цэгцтэй өдөр." },
  { id: "soft-day", title: "Зөөлөн өдөр", paletteFamily: "warm", silhouette: "relaxed", formality: "casual", patternDensity: "low", reasonHint: "Дулаан өнгө, сул эсгүүр, өдөр тутмын тух." },
  { id: "clear-line", title: "Цэвэр шугам", paletteFamily: "contrast", silhouette: "straight", formality: "smart", patternDensity: "none", reasonHint: "Ялгаралтай өнгө, цэвэр шугам." },
  { id: "easy-layer", title: "Давхарласан тух", paletteFamily: "earth", silhouette: "relaxed", formality: "casual", patternDensity: "mid", reasonHint: "Шороон өнгө, давхарласан тухтай хувцас." },
  { id: "calm-mono", title: "Нэг өнгийн тайван", paletteFamily: "neutral", silhouette: "straight", formality: "casual", patternDensity: "none", reasonHint: "Нэг өнгийн тайван, шулуун силуэт." },
  { id: "soft-volume", title: "Зөөлөн өргөн", paletteFamily: "warm", silhouette: "relaxed", formality: "smart", patternDensity: "low", reasonHint: "Дулаан өнгө, зөөлөн өргөн эсгүүр." },
  { id: "crisp-day", title: "Цэвэр өдөр", paletteFamily: "contrast", silhouette: "straight", formality: "casual", patternDensity: "low", reasonHint: "Тодорхой өнгө, өдөр тутмын шулуун эсгүүр." },
  { id: "gentle-texture", title: "Зөөлөн барзгар", paletteFamily: "earth", silhouette: "relaxed", formality: "smart", patternDensity: "mid", reasonHint: "Шороон өнгө, зөөлөн бүтэц, нямбай тух." },
];

export const STYLE_EXAMPLES: StyleExample[] = [
  { id: "ex-neutral-shirt", title: "Цайвар шулуун цамц", paletteFamily: "neutral", silhouette: "straight", formality: "smart", patternDensity: "none" },
  { id: "ex-warm-knit", title: "Дулаан сүлжмэл", paletteFamily: "warm", silhouette: "relaxed", formality: "casual", patternDensity: "low" },
  { id: "ex-contrast-jacket", title: "Бараан хүрэм", paletteFamily: "contrast", silhouette: "straight", formality: "smart", patternDensity: "none" },
  { id: "ex-earth-layer", title: "Шороон давхарлалт", paletteFamily: "earth", silhouette: "relaxed", formality: "casual", patternDensity: "mid" },
  { id: "ex-mono-tee", title: "Нэг өнгийн подволк", paletteFamily: "neutral", silhouette: "straight", formality: "casual", patternDensity: "none" },
  { id: "ex-warm-dress", title: "Дулаан урт өмсгөл", paletteFamily: "warm", silhouette: "relaxed", formality: "smart", patternDensity: "low" },
  { id: "ex-crisp-shirt", title: "Цэвэр өдрийн цамц", paletteFamily: "contrast", silhouette: "straight", formality: "casual", patternDensity: "low" },
  { id: "ex-texture-jacket", title: "Барзгар хүрэм", paletteFamily: "earth", silhouette: "relaxed", formality: "smart", patternDensity: "mid" },
  { id: "ex-soft-trouser", title: "Сул өмд", paletteFamily: "neutral", silhouette: "relaxed", formality: "casual", patternDensity: "none" },
];

export function getVersion(id: string) {
  const version = VERSIONS.find((item) => item.id === id);
  if (!version) throw new Error("version_missing");
  return version;
}

export function getTestBySlug(slug: string) {
  return TESTS.find((item) => item.slug === slug) ?? null;
}

export function getTest(id: string) {
  const test = TESTS.find((item) => item.id === id);
  if (!test) throw new Error("test_missing");
  return test;
}

function q(id: string, text: string, options: [string, string, number][]) {
  return {
    id,
    text,
    options: options.map(([optionId, label, score]) => ({ id: optionId, label, score })),
  };
}

function likert(): [string, string, number][] {
  return [
    ["0", "Бараг үгүй", 0],
    ["1", "Заримдаа", 1],
    ["2", "Олонтоо", 2],
    ["3", "Бараг өдөр бүр", 3],
  ];
}

function band(
  id: string,
  min: number,
  max: number,
  title: string,
  summary: string,
  detail: string[],
  paidOutline: string[],
) {
  return { id, min, max, title, summary, detail, paidOutline };
}
