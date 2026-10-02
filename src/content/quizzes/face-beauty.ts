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
      ['Яг хэлэхэд мэдэхгүй', {}],
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
    sectionTitle: 'Personal Color',
    text: 'Таны байгалийн үсний өнгө?',
    options: attributed([
      ['Маш хар', { value: 'deep' }],
      ['Dark brown', { value: 'deep' }],
      ['Medium brown', { value: 'medium' }],
      ['Light brown', { value: 'light' }],
      ['Blonde', { value: 'light' }],
      ['Red / copper', { undertone: 'warm' }],
    ]),
  },
  {
    id: 'pc_02',
    section: 'II',
    sectionTitle: 'Personal Color',
    text: 'Таны нүдний өнгө?',
    options: attributed([
      ['Маш бараан бор', { value: 'deep' }],
      ['Бор', { value: 'medium_deep' }],
      ['Hazel', { undertone: 'neutral_warm' }],
      ['Green', { undertone: 'neutral' }],
      ['Gray', { undertone: 'cool' }],
      ['Blue', { undertone: 'cool' }],
    ]),
  },
  {
    id: 'pc_03',
    section: 'II',
    sectionTitle: 'Personal Color',
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
    sectionTitle: 'Personal Color',
    text: 'Алтан болон мөнгөн гоёлын аль нь илүү зохидог гэж боддог вэ?',
    options: attributed([
      ['Gold', { undertone: 'warm' }],
      ['Silver', { undertone: 'cool' }],
      ['Rose gold', { undertone: 'neutral_warm' }],
      ['Аль аль нь', { undertone: 'neutral' }],
    ]),
  },
  {
    id: 'pc_05',
    section: 'II',
    sectionTitle: 'Personal Color',
    text: 'Цэвэр цагаан болон cream өнгийн аль нь илүү зохидог вэ?',
    options: attributed([
      ['Pure white', { undertone: 'cool' }],
      ['Ivory / cream', { undertone: 'warm' }],
      ['Аль аль нь', { undertone: 'neutral' }],
    ]),
  },
  {
    id: 'pc_06',
    section: 'II',
    sectionTitle: 'Personal Color',
    text: 'Ямар өнгийн хувцас өмсөхөд нүүр тань хамгийн гэрэлтсэн харагддаг вэ?',
    options: attributed([
      ['Orange / coral / peach', { undertone: 'warm', chroma: 'bright' }],
      ['Blue / pink / purple', { undertone: 'cool' }],
      ['Olive / rust / camel', { undertone: 'warm', chroma: 'soft' }],
      ['Black / white / jewel tones', { undertone: 'cool', chroma: 'bright', value: 'deep' }],
      ['Мэдэхгүй', {}],
    ]),
  },
  {
    id: 'pc_07',
    section: 'II',
    sectionTitle: 'Personal Color',
    text: 'Нүүрэнд ойр байрлах шар өнгө танд ямар харагддаг вэ?',
    options: attributed([
      ['Сэргээдэг', { undertone: 'warm' }],
      ['Нүүрийг шарлуулдаг', { undertone: 'cool' }],
      ['Neutral', { undertone: 'neutral' }],
    ]),
  },
  {
    id: 'pc_08',
    section: 'II',
    sectionTitle: 'Personal Color',
    text: 'Lipstick дээр танд ихэвчлэн аль өнгө илүү зохидог вэ?',
    options: attributed([
      ['Coral / peach', { undertone: 'warm', season_family: 'spring' }],
      ['Rose / mauve', { undertone: 'cool', season_family: 'summer' }],
      ['Brick / terracotta', { undertone: 'warm', season_family: 'autumn' }],
      ['Berry / cherry red', { undertone: 'cool', season_family: 'winter' }],
      ['Мэдэхгүй', {}],
    ]),
  },
  {
    id: 'fc_01',
    section: 'III',
    sectionTitle: 'Facial Contrast',
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
    sectionTitle: 'Facial Contrast',
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
    sectionTitle: 'Facial Contrast',
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
    sectionTitle: 'Facial Contrast',
    text: 'Black eyeliner хэрэглэхэд танд хэр тохирдог вэ?',
    options: scored([
      ['Маш зохидог', { high: 2 }],
      ['Medium хэрэглэвэл зохидог', { medium: 2 }],
      ['Хэт хүнд харагддаг', { low: 2 }],
    ]),
  },
  {
    id: 'ff_01',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Таны нүдний хэмжээ?',
    options: valued([['Том', 'large'], ['Дунд', 'medium'], ['Жижиг', 'small']]),
  },
  {
    id: 'ff_02',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Нүд хоорондын зай?',
    options: valued([['Ойр', 'close_set'], ['Стандарт', 'balanced'], ['Хол', 'wide_set']]),
  },
  {
    id: 'ff_03',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Нүдний гадна булан ямар чиглэлтэй вэ?',
    options: valued([['Дээш чиглэсэн', 'upturned'], ['Хэвтээ', 'neutral'], ['Доош чиглэсэн', 'downturned']]),
  },
  {
    id: 'ff_04',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Таны нүдний хэлбэр?',
    options: valued([['Almond', 'almond'], ['Round', 'round'], ['Hooded', 'hooded'], ['Monolid', 'monolid'], ['Deep-set', 'deep_set']]),
  },
  {
    id: 'ff_05',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Таны хөмсөгний хэлбэр?',
    options: valued([['Straight', 'straight'], ['Soft arch', 'soft_arch'], ['High arch', 'high_arch'], ['Rounded', 'rounded']]),
  },
  {
    id: 'ff_06',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Хамрын хэмжээ нүүртэй харьцуулахад?',
    options: valued([['Жижиг', 'small'], ['Дунд', 'medium'], ['Том', 'large']]),
  },
  {
    id: 'ff_07',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Таны уруулын хэлбэр?',
    options: valued([['Thin', 'thin'], ['Medium', 'medium'], ['Full', 'full'], ['Upper lip thin / lower full', 'lower_full'], ['Upper full / lower thin', 'upper_full']]),
  },
  {
    id: 'ff_08',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Таны хацрын яс?',
    options: valued([['Өндөр, тод', 'high_prominent'], ['Medium', 'medium'], ['Зөөлөн / бага тод', 'soft']]),
  },
  {
    id: 'ff_09',
    section: 'IV',
    sectionTitle: 'Facial Features',
    text: 'Таны эрүүний бүтэц?',
    options: valued([['Sharp', 'sharp'], ['Rounded', 'rounded'], ['Wide', 'wide'], ['Narrow', 'narrow']]),
  },
  {
    id: 'ke_01',
    section: 'V',
    sectionTitle: 'Kitchener Essence',
    text: 'Таны нүүрний ерөнхий impression альтай илүү ойролцоо вэ?',
    options: scored([
      ['Sharp, strong', { dramatic: 3 }],
      ['Relaxed, natural', { natural: 3 }],
      ['Balanced, refined', { classic: 3 }],
      ['Youthful, playful', { gamine: 3 }],
      ['Soft, sensual', { romantic: 3 }],
      ['Sweet, delicate', { ingenue: 3 }],
      ['Long, dreamy', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_02',
    section: 'V',
    sectionTitle: 'Kitchener Essence',
    text: 'Таны нүүрний үндсэн шугам?',
    options: scored([
      ['Sharp angular', { dramatic: 3 }],
      ['Broad blunt', { natural: 3 }],
      ['Balanced', { classic: 3 }],
      ['Small angular', { gamine: 3 }],
      ['Rounded', { romantic: 3 }],
      ['Small rounded', { ingenue: 3 }],
      ['Long delicate', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_03',
    section: 'V',
    sectionTitle: 'Kitchener Essence',
    text: 'Таны нүдний ерөнхий impression?',
    options: scored([
      ['Intense', { dramatic: 3 }],
      ['Relaxed', { natural: 3 }],
      ['Calm', { classic: 3 }],
      ['Playful', { gamine: 3 }],
      ['Sensual', { romantic: 3 }],
      ['Innocent', { ingenue: 3 }],
      ['Dreamy', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_04',
    section: 'V',
    sectionTitle: 'Kitchener Essence',
    text: 'Танд ямар ээмэг хамгийн natural харагддаг вэ?',
    options: scored([
      ['Large geometric', { dramatic: 3 }],
      ['Organic textured', { natural: 3 }],
      ['Simple pearl / minimal', { classic: 3 }],
      ['Small graphic', { gamine: 3 }],
      ['Curved glamorous', { romantic: 3 }],
      ['Small cute delicate', { ingenue: 3 }],
      ['Long thin ethereal', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_05',
    section: 'V',
    sectionTitle: 'Kitchener Essence',
    text: 'Танд ямар хувцасны detail илүү зохидог вэ?',
    options: scored([
      ['Sharp structured', { dramatic: 3 }],
      ['Relaxed oversized', { natural: 3 }],
      ['Clean tailored', { classic: 3 }],
      ['Contrast / cropped', { gamine: 3 }],
      ['Draped feminine', { romantic: 3 }],
      ['Small decorative details', { ingenue: 3 }],
      ['Flowing elongated', { ethereal: 3 }],
    ]),
  },
  {
    id: 'ke_06',
    section: 'V',
    sectionTitle: 'Kitchener Essence',
    text: 'Танд ямар hairstyle илүү зохидог вэ?',
    options: scored([
      ['Sleek structured', { dramatic: 3 }],
      ['Natural texture', { natural: 3 }],
      ['Polished classic', { classic: 3 }],
      ['Short / playful', { gamine: 3 }],
      ['Glamorous waves', { romantic: 3 }],
      ['Soft cute styles', { ingenue: 3 }],
      ['Long flowing', { ethereal: 3 }],
    ]),
  },
];

export const faceNames: Record<string, string> = {
  oval: 'Зууван',
  round: 'Дугуй',
  square: 'Дөрвөлжин',
  rectangle: 'Тэгш өнцөгт',
  oblong: 'Уртавтар',
  heart: 'Зүрхэн',
  inverted_triangle: 'Урвуу гурвалжин',
  diamond: 'Алмазан',
  triangle_pear: 'Лийрэн',
};

export const essenceNames: Record<string, string> = {
  dramatic: 'Dramatic',
  natural: 'Natural',
  classic: 'Classic',
  gamine: 'Gamine',
  romantic: 'Romantic',
  ingenue: 'Ingenue',
  ethereal: 'Ethereal',
};

export const contrastNames: Record<string, string> = {
  high: 'Өндөр',
  medium: 'Дунд',
  low: 'Зөөлөн',
};

