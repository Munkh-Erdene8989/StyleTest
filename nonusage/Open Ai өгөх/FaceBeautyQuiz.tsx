import { useEffect, useMemo, useRef, useState } from 'react';
import narukaLogo from './assets/naruka-logo.png';

type ScoreMap = Record<string, number>;
type Option = {
  id: string;
  label: string;
  scores?: ScoreMap;
  attributes?: Record<string, string>;
  value?: string;
};
type Question = {
  id: string;
  section: string;
  sectionTitle: string;
  text: string;
  options: Option[];
};
type Answers = Record<string, Option>;
type Step = 'intro' | 'photo' | 'questions' | 'analyzing' | 'results';

const STORAGE_KEY = 'naruka-face-beauty-test-v1';

const scored = (labels: Array<[string, ScoreMap]>): Option[] =>
  labels.map(([label, scores], index) => ({
    id: String.fromCharCode(97 + index),
    label,
    scores,
  }));

const valued = (labels: Array<[string, string]>): Option[] =>
  labels.map(([label, value], index) => ({
    id: String.fromCharCode(97 + index),
    label,
    value,
  }));

const attributed = (
  labels: Array<[string, Record<string, string>]>,
): Option[] =>
  labels.map(([label, attributes], index) => ({
    id: String.fromCharCode(97 + index),
    label,
    attributes,
  }));

const questions: Question[] = [
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

const faceNames: Record<string, string> = {
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

const essenceNames: Record<string, string> = {
  dramatic: 'Dramatic',
  natural: 'Natural',
  classic: 'Classic',
  gamine: 'Gamine',
  romantic: 'Romantic',
  ingenue: 'Ingenue',
  ethereal: 'Ethereal',
};

const contrastNames: Record<string, string> = {
  high: 'Өндөр',
  medium: 'Дунд',
  low: 'Зөөлөн',
};

const seasonNames: Record<string, string> = {
  spring: 'Warm Spring',
  summer: 'Cool Summer',
  autumn: 'Warm Autumn',
  winter: 'Deep Winter',
};

function Icon({ name, className = 'size-5' }: { name: 'camera' | 'upload' | 'check' | 'shield' | 'sparkle' | 'image'; className?: string }) {
  const paths = {
    camera: <><path d="M14.5 4.5 13 2.75h-2L9.5 4.5H6.25A2.25 2.25 0 0 0 4 6.75v8A2.25 2.25 0 0 0 6.25 17h11.5A2.25 2.25 0 0 0 20 14.75v-8a2.25 2.25 0 0 0-2.25-2.25H14.5Z" /><circle cx="12" cy="10.5" r="3.25" /></>,
    upload: <><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5" /><path d="M4 13.5v3.25A2.25 2.25 0 0 0 6.25 19h11.5A2.25 2.25 0 0 0 20 16.75V13.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <path d="M12 3 5.5 5.75v5.5c0 4.1 2.75 7.1 6.5 8.75 3.75-1.65 6.5-4.65 6.5-8.75v-5.5L12 3Zm-3 8.5 2 2 4-4" />,
    sparkle: <path d="m12 2 1.2 4.3L17.5 7.5l-4.3 1.2L12 13l-1.2-4.3-4.3-1.2 4.3-1.2L12 2Zm5 11 .7 2.3 2.3.7-2.3.7L17 19l-.7-2.3L14 16l2.3-.7L17 13Z" />,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m5 18 4.5-4.5 3 3 2.5-2.5 4 4" /></>,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function totalScores(answers: Answers, prefix: string) {
  const totals: ScoreMap = {};
  Object.entries(answers)
    .filter(([id]) => id.startsWith(prefix))
    .forEach(([, answer]) => {
      Object.entries(answer.scores || {}).forEach(([key, value]) => {
        totals[key] = (totals[key] || 0) + value;
      });
    });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function ResultCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-cream-dark bg-white p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl text-charcoal">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{note}</p>
    </div>
  );
}

export default function FaceBeautyQuiz({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').answers || {};
    } catch {
      return {};
    }
  });
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState('');
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const question = questions[current];

  useEffect(() => {
    if (!photo) {
      setPhotoUrl('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (step !== 'analyzing') return;
    const timer = window.setTimeout(() => setStep('results'), 2600);
    return () => window.clearTimeout(timer);
  }, [step]);

  const result = useMemo(() => {
    const face = totalScores(answers, 'fs_');
    const contrast = totalScores(answers, 'fc_');
    const essence = totalScores(answers, 'ke_');
    const attributes: Record<string, ScoreMap> = {};
    Object.entries(answers)
      .filter(([id]) => id.startsWith('pc_'))
      .forEach(([, answer]) => {
        Object.entries(answer.attributes || {}).forEach(([type, value]) => {
          attributes[type] ||= {};
          attributes[type][value] = (attributes[type][value] || 0) + 1;
        });
      });
    const topAttribute = (type: string, fallback: string) =>
      Object.entries(attributes[type] || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
    const undertone = topAttribute('undertone', 'neutral');
    const value = topAttribute('value', 'medium');
    const chroma = topAttribute('chroma', 'soft');
    let season = topAttribute('season_family', '');
    if (!season) season = undertone.includes('warm') ? (value === 'deep' ? 'autumn' : 'spring') : value === 'deep' || chroma === 'bright' ? 'winter' : 'summer';
    const essenceTotal = essence.reduce((sum, [, score]) => sum + score, 0) || 1;
    return {
      face: face[0]?.[0] || 'oval',
      secondaryFace: face[1]?.[0] || 'round',
      contrast: contrast[0]?.[0] || 'medium',
      undertone,
      value,
      chroma,
      season,
      essences: essence.slice(0, 3).map(([key, score]) => ({
        key,
        percentage: Math.round((score / essenceTotal) * 100),
      })),
    };
  }, [answers]);

  const progress =
    step === 'intro' ? 0 : step === 'photo' ? 4 : step === 'questions'
      ? Math.round(5 + ((current + 1) / questions.length) * 88)
      : 100;

  function choosePhoto(file?: File) {
    setPhotoError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('JPG, PNG эсвэл WEBP зураг сонгоно уу.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Зургийн хэмжээ 10MB-аас бага байх шаардлагатай.');
      return;
    }
    setPhoto(file);
  }

  function startQuestions() {
    if (!photo || !consent) return;
    const savedCount = Object.keys(answers).length;
    setCurrent(Math.min(savedCount, questions.length - 1));
    setStep('questions');
  }

  function selectAnswer(option: Option) {
    const nextAnswers = { ...answers, [question.id]: option };
    setAnswers(nextAnswers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: nextAnswers, updatedAt: new Date().toISOString() }));
    window.setTimeout(() => {
      if (current === questions.length - 1) setStep('analyzing');
      else setCurrent((value) => value + 1);
    }, 220);
  }

  function goBack() {
    if (step === 'photo') setStep('intro');
    else if (step === 'questions' && current === 0) setStep('photo');
    else if (step === 'questions') setCurrent((value) => Math.max(0, value - 1));
    else if (step === 'results') {
      setStep('questions');
      setCurrent(questions.length - 1);
    }
  }

  function restart() {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setCurrent(0);
    setPhoto(null);
    setConsent(false);
    setStep('intro');
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-cream">
      <div className="pointer-events-none fixed -left-28 top-32 size-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-36 bottom-8 size-96 rounded-full bg-bordeaux/10 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-cream-dark bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <button type="button" onClick={onClose} aria-label="Тест хаах" className="flex size-10 items-center justify-center rounded-full border border-transparent text-xl text-charcoal-soft transition hover:border-cream-dark hover:bg-white">×</button>
          <img src={narukaLogo} alt="Naruka Styling Studio" className="h-9 w-auto object-contain brightness-0" />
          <button type="button" onClick={goBack} disabled={step === 'intro' || step === 'analyzing'} className="rounded-full px-3 py-2 text-sm font-semibold text-bordeaux transition hover:bg-blush disabled:invisible">Буцах</button>
        </div>
        <div className="h-1 bg-cream-dark">
          <div className="h-full rounded-r-full bg-gradient-to-r from-gold to-bordeaux transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-4 py-7 sm:px-5 sm:py-10">
        {step === 'intro' && (
          <section className="animate-[fadeIn_.3s_ease-out] overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 shadow-xl shadow-charcoal/5 backdrop-blur-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-bordeaux via-bordeaux to-bordeaux-light px-6 py-12 text-center text-white sm:px-12 sm:py-16">
              <div className="absolute -right-16 -top-16 size-52 rounded-full border border-white/10" />
              <div className="absolute -bottom-20 -left-10 size-48 rounded-full bg-gold/10 blur-xl" />
              <p className="relative mx-auto mb-5 w-fit rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-light">Шинэ · AI Beauty Analysis</p>
              <h2 className="relative font-display text-4xl leading-none sm:text-6xl">Face &amp; Beauty<br /><em className="text-gold-light">Style</em></h2>
              <p className="relative mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">Нүүрний зураг болон 32 асуултын хариултыг хослуулан таны байгалийн онцлогт нийцэх өнгө, makeup, үс засалт, аксессуарын чиглэлийг тодорхойлно.</p>
            </div>
            <div className="p-6 sm:p-10">
              <div className="grid grid-cols-3 divide-x divide-cream-dark rounded-2xl bg-cream-dark/60 py-5 text-center">
                <div><p className="font-display text-2xl text-bordeaux">32</p><p className="mt-1 text-xs text-muted">асуулт</p></div>
                <div><p className="font-display text-2xl text-bordeaux">5–8</p><p className="mt-1 text-xs text-muted">минут</p></div>
                <div><p className="font-display text-2xl text-bordeaux">5</p><p className="mt-1 text-xs text-muted">шинжилгээ</p></div>
              </div>
              <div className="my-7 grid gap-3 sm:grid-cols-2">
                {[
                  ['Нүүрний хэлбэр', 'Харьцаа, эрүү, хацрын яс'],
                  ['Personal Color', 'Undertone, value, chroma'],
                  ['Facial Features', 'Нүд, хөмсөг, хамар, уруул'],
                  ['Kitchener Essence', 'Таны визуал төрхийн blend'],
                ].map(([title, text]) => (
                  <div key={title} className="flex gap-3 rounded-2xl border border-cream-dark bg-white p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blush text-bordeaux"><Icon name="sparkle" className="size-4" /></span>
                    <div><p className="text-sm font-semibold text-charcoal">{title}</p><p className="mt-0.5 text-xs text-muted">{text}</p></div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setStep('photo')} className="group w-full rounded-full bg-bordeaux px-6 py-4 font-semibold text-white shadow-lg shadow-bordeaux/15 transition-all hover:-translate-y-0.5 hover:bg-bordeaux-dark">
                <span className="flex items-center justify-center gap-2">Тестээ эхлүүлэх <span className="transition-transform group-hover:translate-x-1">→</span></span>
              </button>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted"><Icon name="shield" className="size-4" />Таны зураг зөвхөн энэхүү шинжилгээнд ашиглагдана.</p>
            </div>
          </section>
        )}

        {step === 'photo' && (
          <section className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
            <div className="mb-7">
              <p className="mb-4 w-fit rounded-full bg-blush px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-bordeaux">Зургийн шинжилгээ</p>
              <h2 className="font-display text-3xl text-charcoal sm:text-4xl">Нүүрний зургаа оруулна уу</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Камер руу эгц харсан, жигд гэрэлтэй зураг хамгийн нарийн үр дүн гаргана.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
              <div>
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border-2 border-dashed border-gold/50 bg-cream-dark/70">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Сонгосон нүүрний зураг" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center px-7 text-center">
                      <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-white text-bordeaux shadow-sm"><Icon name="image" className="size-7" /></span>
                      <p className="font-semibold text-charcoal">Зураг сонгоогүй байна</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted">JPG, PNG, WEBP · 10MB хүртэл</p>
                    </div>
                  )}
                  {photoUrl && <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-charcoal/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"><Icon name="check" className="size-4" />Зураг бэлэн</div>}
                </div>
                <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={(event) => choosePhoto(event.target.files?.[0])} />
                <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => choosePhoto(event.target.files?.[0])} />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => cameraRef.current?.click()} className="flex items-center justify-center gap-2 rounded-full border border-cream-dark bg-white px-4 py-3 text-sm font-semibold text-charcoal transition hover:border-gold"><Icon name="camera" className="size-4" />Камер</button>
                  <button type="button" onClick={() => uploadRef.current?.click()} className="flex items-center justify-center gap-2 rounded-full border border-cream-dark bg-white px-4 py-3 text-sm font-semibold text-charcoal transition hover:border-gold"><Icon name="upload" className="size-4" />Зураг сонгох</button>
                </div>
                {photoError && <p className="mt-3 text-sm font-medium text-bordeaux">{photoError}</p>}
              </div>

              <div className="flex flex-col">
                <div className="rounded-3xl bg-cream-dark/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-bordeaux">Сайн зураг авах 6 алхам</p>
                  <ul className="mt-4 space-y-3">
                    {[
                      'Нүүр бүтнээрээ харагдаж, камер руу эгц харсан',
                      'Үс нүүрийг халхлаагүй, малгайгүй байх',
                      'Нүдний шил болон beauty filter ашиглаагүй',
                      'Neutral expression-тэй байх',
                      'Natural daylight эсвэл neutral white light',
                      'Heavy makeup-гүй, нүүрний хоёр тал жигд гэрэлтэй',
                    ].map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-snug text-charcoal-soft">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-bordeaux"><Icon name="check" className="size-3" /></span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-cream-dark bg-white p-4">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 size-5 accent-bordeaux" />
                  <span className="text-sm leading-relaxed text-charcoal-soft">Би өөрийн нүүрний зургийг энэхүү стиль болон гоо сайхны шинжилгээнд ашиглуулахыг зөвшөөрч байна.</span>
                </label>
                <button type="button" disabled={!photo || !consent} onClick={startQuestions} className="mt-auto w-full rounded-full bg-bordeaux px-6 py-4 font-semibold text-white shadow-lg shadow-bordeaux/15 transition hover:bg-bordeaux-dark disabled:cursor-not-allowed disabled:opacity-40">Асуултаа эхлүүлэх →</button>
              </div>
            </div>
          </section>
        )}

        {step === 'questions' && (
          <section key={question.id} className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <p className="rounded-full bg-blush px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-bordeaux">{question.section}. {question.sectionTitle}</p>
              </div>
              <p className="shrink-0 text-xs font-medium text-muted">{current + 1} / {questions.length}</p>
            </div>
            <h2 className="min-h-20 font-display text-2xl leading-snug text-charcoal sm:text-3xl">{question.text}</h2>
            <div className={`mt-7 grid gap-3 ${question.options.length > 5 ? 'sm:grid-cols-2' : ''}`}>
              {question.options.map((option) => {
                const selected = answers[question.id]?.id === option.id;
                return (
                  <button type="button" key={option.id} onClick={() => selectAnswer(option)} className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${selected ? 'border-bordeaux bg-bordeaux text-white shadow-md shadow-bordeaux/15' : 'border-cream-dark bg-white text-charcoal hover:-translate-y-0.5 hover:border-gold hover:shadow-md'}`}>
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase ${selected ? 'bg-white text-bordeaux' : 'bg-cream-dark text-bordeaux'}`}>{option.id}</span>
                    <span className="text-sm font-semibold leading-snug sm:text-base">{option.label}</span>
                    {selected && <Icon name="check" className="ml-auto size-5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 'analyzing' && (
          <section className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 px-6 py-16 text-center shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:px-12 sm:py-24">
            <div className="relative mx-auto mb-8 flex size-24 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-cream-dark border-t-bordeaux" />
              <span className="flex size-16 items-center justify-center rounded-full bg-blush text-bordeaux"><Icon name="sparkle" className="size-7" /></span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-bordeaux">Шинжилж байна</p>
            <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">Таны beauty profile-г бүтээж байна</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted">Зургийн үндсэн үзүүлэлт, нүүрний харьцаа болон 32 хариултыг нэгтгэж байна.</p>
            <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {['Нүүрний пропорц', 'Өнгө ба контраст', 'Essence blend'].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-cream-dark/70 px-4 py-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-bordeaux text-white"><Icon name="check" className="size-3" /></span>
                  <span className="text-sm font-medium text-charcoal">{item}</span>
                  <span className="ml-auto text-xs text-muted">{index === 2 ? 'Нэгтгэж байна' : 'Бэлэн'}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 'results' && (
          <section className="animate-[fadeIn_.3s_ease-out] overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 shadow-xl shadow-charcoal/5 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-bordeaux to-bordeaux-light px-6 py-10 text-center text-white sm:px-10 sm:py-12">
              <p className="mx-auto mb-4 w-fit rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-light">Таны Face &amp; Beauty Profile</p>
              <h2 className="font-display text-4xl sm:text-5xl">{seasonNames[result.season] || 'Personal Color'}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70">{faceNames[result.face]} нүүрний хэлбэр · {contrastNames[result.contrast]} контраст · {essenceNames[result.essences[0]?.key] || 'Classic'} essence</p>
            </div>

            <div className="p-5 sm:p-9">
              <div className="grid gap-4 sm:grid-cols-2">
                <ResultCard label="Face Shape" value={faceNames[result.face]} note={`Хоёрдогч хэлбэр: ${faceNames[result.secondaryFace]}. Нүүр орчимд зөөлөн баланс, зөв өргөн үүсгэх шугам тохирно.`} />
                <ResultCard label="Personal Color" value={seasonNames[result.season] || 'Neutral'} note={`${result.undertone.replace('_', ' ')} undertone · ${result.value} value · ${result.chroma} chroma`} />
                <ResultCard label="Facial Contrast" value={`${contrastNames[result.contrast]} contrast`} note={result.contrast === 'high' ? 'Тод өнгө, цэвэр хар-цагаан болон jewel tone танд сайн ажиллана.' : result.contrast === 'low' ? 'Зөөлөн, ойролцоо өнгийн tonal хослол нүүрийг илүү гэрэлтүүлнэ.' : 'Дунд зэргийн контраст, нэг төвлөрсөн акцент хамгийн тэнцвэртэй.'} />
                <div className="rounded-2xl border border-cream-dark bg-white p-5">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">Kitchener Essence Blend</p>
                  <div className="mt-4 space-y-3">
                    {result.essences.map((essence) => (
                      <div key={essence.key}>
                        <div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold text-charcoal">{essenceNames[essence.key]}</span><span className="text-bordeaux">{essence.percentage}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-cream-dark"><div className="h-full rounded-full bg-gradient-to-r from-gold to-bordeaux" style={{ width: `${essence.percentage}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-cream-dark/70 p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-widest text-bordeaux">Таны beauty direction</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <div><p className="font-semibold text-charcoal">Makeup</p><p className="mt-2 text-sm leading-relaxed text-muted">{result.undertone.includes('cool') ? 'Cool rose, berry, plum' : 'Peach, coral, warm rose'} өнгө. {result.contrast === 'high' ? 'Тод eyeliner' : 'Зөөлөн brown liner'} ашиглаарай.</p></div>
                  <div><p className="font-semibold text-charcoal">Hair &amp; glasses</p><p className="mt-2 text-sm leading-relaxed text-muted">{result.face === 'round' ? 'Урт, босоо чиглэлтэй' : result.face === 'square' ? 'Зөөлөн долгионтой' : 'Тэнцвэртэй, нүүр хүрээлсэн'} үс болон {result.face === 'round' ? 'geometric' : 'soft rectangular'} хүрээ тохирно.</p></div>
                  <div><p className="font-semibold text-charcoal">Jewelry</p><p className="mt-2 text-sm leading-relaxed text-muted">{result.undertone.includes('cool') ? 'Silver, white gold' : 'Gold, warm rose gold'} металл. {result.essences[0]?.key === 'dramatic' ? 'Geometric statement' : 'Цэвэр, тэнцвэртэй'} хэлбэр сонгоорой.</p></div>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={restart} className="rounded-full border border-cream-dark bg-white px-6 py-4 text-sm font-semibold text-muted transition hover:border-gold hover:text-charcoal">Дахин бөглөх</button>
                <button type="button" onClick={onClose} className="rounded-full bg-bordeaux px-6 py-4 text-sm font-semibold text-white transition hover:bg-bordeaux-dark">Үр дүнг хадгалаад дуусгах</button>
              </div>
              <p className="mt-5 text-center text-xs leading-relaxed text-muted">Энэхүү онлайн үр дүн нь урьдчилсан чиглэл юм. Мэргэжлийн биечилсэн анализ илүү нарийн үр дүн өгнө.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
