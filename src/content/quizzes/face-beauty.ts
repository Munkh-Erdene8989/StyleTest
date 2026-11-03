export type ScoreMap = Record<string, number>;
export type FaceOption = {
  id: string;
  label: string;
  scores?: ScoreMap;
  attributes?: Record<string, string>;
  value?: string;
};
export type FaceQuestion = {
  id: string;
  section: string;
  sectionTitle: string;
  text: string;
  options: FaceOption[];
};
const scored = (labels: Array<[string, ScoreMap]>): FaceOption[] =>
  labels.map(([label, scores], index) => ({
    id: String.fromCharCode(97 + index),
    label,
    scores,
  }));

const valued = (labels: Array<[string, string]>): FaceOption[] =>
  labels.map(([label, value], index) => ({
    id: String.fromCharCode(97 + index),
    label,
    value,
  }));

const attributed = (
  labels: Array<[string, Record<string, string>]>,
): FaceOption[] =>
  labels.map(([label, attributes], index) => ({
    id: String.fromCharCode(97 + index),
    label,
    attributes,
  }));

export const faceQuestions: FaceQuestion[] = [
  {
    id: 'fs_01',
    section: 'I',
    sectionTitle: 'Нүүрний хэлбэр',
    text: 'Таны духны өргөн ямар харагддаг вэ?',
    options: scored([
      ['Эрүүний хэсгээс өргөн', { heart: 2, inverted_triangle: 2 }],
      ['Хацрын ястай ойролцоо', { oval: 1, square: 1, rectangle: 1 }],
      ['Эрүүний хэсгээс нарийн', { triangle_pear: 2 }],
      ['Яг хэлж мэдэхгүй', {}],
    ]),
  },
  {
    id: 'fs_02',
    section: 'I',
    sectionTitle: 'Нүүрний хэлбэр',
    text: 'Таны нүүрний хамгийн өргөн хэсэг аль вэ?',
    options: scored([
      ['Дух', { heart: 2, inverted_triangle: 2 }],
      ['Хацрын яс', { diamond: 3, round: 1, oval: 1 }],
      ['Эрүүний шугам', { triangle_pear: 3 }],
      ['Бүх хэсэг ойролцоо', { square: 2, rectangle: 2, oval: 1 }],
    ]),
  },
  {
    id: 'fs_03',
    section: 'I',
    sectionTitle: 'Нүүрний хэлбэр',
    text: 'Эрүүний шугам ямар харагддаг вэ?',
    options: scored([
      ['Дугуй, зөөлөн', { round: 3, oval: 2 }],
      ['Өнцөгтэй', { square: 3, rectangle: 2 }],
      ['Нарийн шовх', { heart: 3, diamond: 2 }],
      ['Урт, шулуун', { oblong: 3, rectangle: 2 }],
    ]),
  },
  {
    id: 'fs_04',
    section: 'I',
    sectionTitle: 'Нүүрний хэлбэр',
    text: 'Эрүүний үзүүр ямар вэ?',
    options: scored([
      ['Дугуй', { round: 2, oval: 2 }],
      ['Өргөн', { square: 3, triangle_pear: 2 }],
      ['Шовх', { heart: 3, diamond: 2 }],
      ['Нарийн урт', { oblong: 3, oval: 1 }],
    ]),
  },
  {
    id: 'fs_05',
    section: 'I',
    sectionTitle: 'Нүүрний хэлбэр',
    text: 'Таны нүүрний урт ба өргөний харьцаа ямар вэ?',
    options: scored([
      ['Бараг ижил', { round: 3, square: 3 }],
      ['Урт нь бага зэрэг илүү', { oval: 3 }],
      ['Урт нь мэдэгдэхүйц илүү', { rectangle: 2, oblong: 3 }],
      ['Маш урт', { oblong: 4 }],
    ]),
  },
  {
    id: 'pc_01',
    section: 'II',
    sectionTitle: 'Хувийн өнгө',
    text: 'Таны байгалийн үсний өнгө?',
    options: attributed([
      ['Маш хар', { value: 'deep' }],
      ['Хар хүрэн', { value: 'deep' }],
      ['Дунд хүрэн', { value: 'medium' }],
      ['Цайвар хүрэн', { value: 'light' }],
      ['Шаргал', { value: 'light' }],
      ['Улаан, зэсэн', { undertone: 'warm' }],
    ]),
  },
  {
    id: 'pc_02',
    section: 'II',
    sectionTitle: 'Хувийн өнгө',
    text: 'Таны нүдний өнгө?',
    options: attributed([
      ['Маш бараан бор', { value: 'deep' }],
      ['Бор', { value: 'medium_deep' }],
      ['Хулсан бор', { undertone: 'neutral_warm' }],
      ['Ногоон', { undertone: 'neutral' }],
      ['Саарал', { undertone: 'cool' }],
      ['Цэнхэр', { undertone: 'cool' }],
    ]),
  },
  {
    id: 'pc_03',
    section: 'II',
    sectionTitle: 'Хувийн өнгө',
    text: 'Нарны гэрэлд арьс тань ихэвчлэн?',
    options: attributed([
      ['Амархан улайдаг', { undertone: 'cool' }],
      ['Эхлээд улайгаад дараа борлодог', { undertone: 'neutral' }],
      ['Амархан борлодог', { undertone: 'warm' }],
      ['Бараг улайдаггүй', { undertone: 'warm' }],
    ]),
  },
  {
    id: 'pc_04',
    section: 'II',
    sectionTitle: 'Хувийн өнгө',
    text: 'Алтан болон мөнгөн гоёлын аль нь илүү зохицдог гэж боддог вэ?',
    options: attributed([
      ['Алт', { undertone: 'warm' }],
      ['Мөнгө', { undertone: 'cool' }],
      ['Ягаан алт', { undertone: 'neutral_warm' }],
      ['Аль аль нь', { undertone: 'neutral' }],
    ]),
  },
  {
    id: 'pc_05',
    section: 'II',
    sectionTitle: 'Хувийн өнгө',
    text: 'Цэвэр цагаан, зааны ясан цагаан хоёрын аль нь илүү зохицдог вэ?',
    options: attributed([
      ['Цэвэр цагаан', { undertone: 'cool' }],
      ['Зааны ясан цагаан', { undertone: 'warm' }],
      ['Аль аль нь', { undertone: 'neutral' }],
    ]),
  },
  {
    id: 'pc_06',
    section: 'II',
    sectionTitle: 'Хувийн өнгө',
    text: 'Ямар өнгийн хувцас өмсөхөд нүүр тань хамгийн гэрэлтэж харагддаг вэ?',
    options: attributed([
      ['Улбар шар, шүрэн, тоор', { undertone: 'warm', chroma: 'bright' }],
      ['Хөх, ягаан, нил ягаан', { undertone: 'cool' }],
      ['Чидун ногоон, зэвэрхэг хүрэн, тэмээний хүрэн', { undertone: 'warm', chroma: 'soft' }],
      ['Хар, цагаан, эрдэнийн тод өнгө', { undertone: 'cool', chroma: 'bright', value: 'deep' }],
      ['Мэдэхгүй', {}],
    ]),
  },
  {
    id: 'pc_07',
    section: 'II',
    sectionTitle: 'Хувийн өнгө',
    text: 'Нүүрэнд ойр байрлах шар өнгө танд ямар харагддаг вэ?',
    options: attributed([
      ['Сэргээдэг', { undertone: 'warm' }],
      ['Нүүрийг шарлуулдаг', { undertone: 'cool' }],
      ['Төвийг сахисан', { undertone: 'neutral' }],
    ]),
  },
  {
    id: 'pc_08',
    section: 'II',
    sectionTitle: 'Хувийн өнгө',
    text: 'Уруулын будгаас танд аль өнгө илүү зохицдог вэ?',
    options: attributed([
      ['Шүрэн, тоор', { undertone: 'warm', season_family: 'spring' }],
      ['Сарнайн ягаан, хөхөвтөр ягаан', { undertone: 'cool', season_family: 'summer' }],
      ['Тоосгон улаан, шавар улаан', { undertone: 'warm', season_family: 'autumn' }],
      ['Жимсний улаан, интоорын улаан', { undertone: 'cool', season_family: 'winter' }],
      ['Мэдэхгүй', {}],
    ]),
  },
  {
    id: 'fc_01',
    section: 'III',
    sectionTitle: 'Нүүрний ялгарал',
    text: 'Таны үс арьснаасаа хэр ялгаатай харагддаг вэ?',
    options: scored([
      ['Маш их', { high: 3 }],
      ['Дунд зэрэг', { medium: 3 }],
      ['Маш бага', { low: 3 }],
    ]),
  },
  {
    id: 'fc_02',
    section: 'III',
    sectionTitle: 'Нүүрний ялгарал',
    text: 'Нүд тань нүүрэндээ хэр тод ялгардаг вэ?',
    options: scored([
      ['Маш тод', { high: 3 }],
      ['Дунд', { medium: 3 }],
      ['Зөөлөн', { low: 3 }],
    ]),
  },
  {
    id: 'fc_03',
    section: 'III',
    sectionTitle: 'Нүүрний ялгарал',
    text: 'Хар өнгийн хувцас нүүрэнд тань ямар харагддаг вэ?',
    options: scored([
      ['Маш сайн', { high: 2 }],
      ['Зүгээр', { medium: 2 }],
      ['Нүүрийг дарж харагдуулдаг', { low: 2 }],
    ]),
  },
  {
    id: 'fc_04',
    section: 'III',
    sectionTitle: 'Нүүрний ялгарал',
    text: 'Хар нүдний зураас татахад танд хэр зохицдог вэ?',
    options: scored([
      ['Маш сайн зохицдог', { high: 2 }],
      ['Дунд зэрэг татахад зохицдог', { medium: 2 }],
      ['Хэт хүнд харагддаг', { low: 2 }],
    ]),
  },
  {
    id: 'ff_01',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Таны нүдний хэмжээ?',
    options: valued([['Том', 'large'], ['Дунд', 'medium'], ['Жижиг', 'small']]),
  },
  {
    id: 'ff_02',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Нүд хоорондын зай?',
    options: valued([['Ойр', 'close_set'], ['Дундаж', 'balanced'], ['Хол', 'wide_set']]),
  },
  {
    id: 'ff_03',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Нүдний гадна булан ямар чиглэлтэй вэ?',
    options: valued([['Дээш чиглэсэн', 'upturned'], ['Хэвтээ', 'neutral'], ['Доош чиглэсэн', 'downturned']]),
  },
  {
    id: 'ff_04',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Таны нүдний хэлбэр?',
    options: valued([['Бүйлсэн', 'almond'], ['Дугуй', 'round'], ['Бүрхүүлтэй зовхи', 'hooded'], ['Нэг давхар зовхи', 'monolid'], ['Гүн суусан', 'deep_set']]),
  },
  {
    id: 'ff_05',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Таны хөмсөгний хэлбэр?',
    options: valued([['Шулуун', 'straight'], ['Зөөлөн нуман', 'soft_arch'], ['Өндөр нуман', 'high_arch'], ['Дугуйрсан', 'rounded']]),
  },
  {
    id: 'ff_06',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Хамрын хэмжээ нүүртэй харьцуулахад?',
    options: valued([['Жижиг', 'small'], ['Дунд', 'medium'], ['Том', 'large']]),
  },
  {
    id: 'ff_07',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Таны уруулын хэлбэр?',
    options: valued([['Нимгэн', 'thin'], ['Дунд', 'medium'], ['Дүүрэн', 'full'], ['Дээд уруул нимгэн, доод нь дүүрэн', 'lower_full'], ['Дээд уруул дүүрэн, доод нь нимгэн', 'upper_full']]),
  },
  {
    id: 'ff_08',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Таны хацрын яс?',
    options: valued([['Өндөр, тод', 'high_prominent'], ['Дунд', 'medium'], ['Зөөлөн, бага тод', 'soft']]),
  },
  {
    id: 'ff_09',
    section: 'IV',
    sectionTitle: 'Нүүрний хэсэг',
    text: 'Таны эрүүний бүтэц?',
    options: valued([['Хурц', 'sharp'], ['Дугуйрсан', 'rounded'], ['Өргөн', 'wide'], ['Нарийн', 'narrow']]),
  },
  {
    id: 'ke_01',
    section: 'V',
    sectionTitle: 'Нүүрний төрх',
    text: 'Таны нүүрний ерөнхий төрх аль нь илүү ойр вэ?',
    options: scored([
      ['Хурц, хүчтэй', { dramatic: 3 }],
      ['Тайван, байгалийн', { natural: 3 }],
      ['Тэнцвэртэй, цэвэр', { classic: 3 }],
      ['Залуу, хөгжилтэй', { gamine: 3 }],
      ['Зөөлөн, дур булаам', { romantic: 3 }],
      ['Наалинхай, нарийн', { ingenue: 3 }],
      ['Урт, зүүдлэм', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_02',
    section: 'V',
    sectionTitle: 'Нүүрний төрх',
    text: 'Таны нүүрний үндсэн шугам ямар вэ?',
    options: scored([
      ['Хурц өнцөгтэй', { dramatic: 3 }],
      ['Өргөн, мохоо', { natural: 3 }],
      ['Тэнцвэртэй', { classic: 3 }],
      ['Жижиг өнцөгтэй', { gamine: 3 }],
      ['Дугуйрсан', { romantic: 3 }],
      ['Жижиг дугуй', { ingenue: 3 }],
      ['Урт, нарийн', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_03',
    section: 'V',
    sectionTitle: 'Нүүрний төрх',
    text: 'Таны нүдний ерөнхий төрх ямар вэ?',
    options: scored([
      ['Хурц, ширүүн', { dramatic: 3 }],
      ['Тайван', { natural: 3 }],
      ['Амар тайван', { classic: 3 }],
      ['Хөгжилтэй', { gamine: 3 }],
      ['Дур булаам', { romantic: 3 }],
      ['Гэнэн, цэвэр', { ingenue: 3 }],
      ['Зүүдлэм', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_04',
    section: 'V',
    sectionTitle: 'Нүүрний төрх',
    text: 'Танд ямар ээмэг хамгийн байгалийн харагддаг вэ?',
    options: scored([
      ['Том, шулуун өнцөгтэй', { dramatic: 3 }],
      ['Байгалийн хэлбэртэй, барзгар', { natural: 3 }],
      ['Энгийн сувд, илүүцгүй', { classic: 3 }],
      ['Жижиг, тод хээтэй', { gamine: 3 }],
      ['Муруй, гялалзсан', { romantic: 3 }],
      ['Жижиг, хөөрхөн, нарийн', { ingenue: 3 }],
      ['Урт, нарийн, агаарлаг', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_05',
    section: 'V',
    sectionTitle: 'Нүүрний төрх',
    text: 'Танд хувцасны ямар нарийн хэсэг илүү зохицдог вэ?',
    options: scored([
      ['Хурц, хэлбэр тод', { dramatic: 3 }],
      ['Чөлөөтэй, сул өргөн', { natural: 3 }],
      ['Цэвэр, биед тааруулсан', { classic: 3 }],
      ['Ялгаралтай, богиносгосон', { gamine: 3 }],
      ['Зөөлөн уналттай, эмэгтэйлэг', { romantic: 3 }],
      ['Жижиг чимэглэлтэй', { ingenue: 3 }],
      ['Урсгалтай, сунасан', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_06',
    section: 'V',
    sectionTitle: 'Нүүрний төрх',
    text: 'Танд ямар үсний загвар илүү зохицдог вэ?',
    options: scored([
      ['Гөлгөр, хэлбэр тод', { dramatic: 3 }],
      ['Байгалийн бүтэцтэй', { natural: 3 }],
      ['Өнгөлсөн, сонгодог', { classic: 3 }],
      ['Богино, хөгжилтэй', { gamine: 3 }],
      ['Гялалзсан долгион', { romantic: 3 }],
      ['Зөөлөн, хөөрхөн', { ingenue: 3 }],
      ['Урт, урсгалтай', { ethereal: 3 }],
    ]),
  },
];

export const faceNames: Record<string, string> = {
  oval: 'Зууван',
  round: 'Дугуй',
  square: 'Дөрвөлжин',
  rectangle: 'Тэгш өнцөгт',
  oblong: 'Сунасан',
  heart: 'Зүрхэн',
  inverted_triangle: 'Урвуу гурвалжин',
  diamond: 'Ромбон',
  triangle_pear: 'Лийр хэлбэрт',
};

export const essenceNames: Record<string, string> = {
  dramatic: 'Хурц',
  natural: 'Байгалийн',
  classic: 'Сонгодог',
  gamine: 'Цовоо',
  romantic: 'Дур булаам',
  ingenue: 'Наалинхай',
  ethereal: 'Агаарлаг',
};

export const contrastNames: Record<string, string> = {
  high: 'Өндөр',
  medium: 'Дунд',
  low: 'Зөөлөн',
};

