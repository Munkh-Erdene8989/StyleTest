import { useState, useEffect, useRef } from 'react';
import narukaLogo from './assets/naruka-logo.png';

// ─── Types ───────────────────────────────────────────────────────────────────
type Section = 'home' | 'about' | 'services' | 'training' | 'gallery' | 'testimonials' | 'contact';
type AuthView = 'login' | 'register';
interface User { name: string; email: string }

// ─── Psychology Test Data ─────────────────────────────────────────────────────
const psychQuestions = [
  {
    id: 1,
    q: 'Та өдөр тутмын хувцасандаа ямар мэдрэмж хайдаг вэ?',
    options: [
      { label: 'Тайвширсан, чөлөөтэй', value: 'soft' },
      { label: 'Тод, өвөрмөц, анхаарал татдаг', value: 'bold' },
      { label: 'Дулаан, байгалийн', value: 'warm' },
      { label: 'Нэр хүндтэй, цэвэрхэн', value: 'cool' },
    ],
  },
  {
    id: 2,
    q: 'Та ямар орчинд сайхан санагддаг вэ?',
    options: [
      { label: 'Байгаль, ой мод, тайван газар', value: 'warm' },
      { label: 'Хот, галерей, уран бүтээлч орчин', value: 'bold' },
      { label: 'Гэр, затишье, дотно уур амьсгал', value: 'soft' },
      { label: 'Ажлын уулзалт, хотын офис', value: 'cool' },
    ],
  },
  {
    id: 3,
    q: 'Бусад хүмүүс таныг ямар хүн гэж дүрсэлдэг вэ?',
    options: [
      { label: 'Зөөлөн, эелдэг, халуун дотно', value: 'soft' },
      { label: 'Хүчтэй, шийдэмгий, итгэлтэй', value: 'cool' },
      { label: 'Бүтээлч, ер бусын, ухаалаг', value: 'bold' },
      { label: 'Байгалийн, жинхэнэ, халамжтай', value: 'warm' },
    ],
  },
  {
    id: 4,
    q: 'Та ямар өнгийг аяндаа сонгодог вэ?',
    options: [
      { label: 'Ягаан, лаванда, зефир өнгө', value: 'soft' },
      { label: 'Улаан, хар, ногоон — тод тодорхой', value: 'bold' },
      { label: 'Хүрэн, зэс, улаанхай шар', value: 'warm' },
      { label: 'Цэнхэр, хар саарал, тэнгэр өнгө', value: 'cool' },
    ],
  },
  {
    id: 5,
    q: 'Таны амьдралын хэв маяг хэрхэн тодорхойлогддог вэ?',
    options: [
      { label: 'Тогтвортой, гэр бүл, дотно харилцаа', value: 'soft' },
      { label: 'Идэвхтэй, аялал, шинэ туршлага', value: 'bold' },
      { label: 'Байгаль, спорт, эрүүл амьдрал', value: 'warm' },
      { label: 'Ажил хэрэг, мэргэжлийн өсөлт', value: 'cool' },
    ],
  },
  {
    id: 6,
    q: 'Та загварын ямар хэв маягт дуртай вэ?',
    options: [
      { label: 'Романтик — даашинз, нарийн хээ', value: 'soft' },
      { label: 'Авангард — тод өнгө, том хэлбэр', value: 'bold' },
      { label: 'Бохемик — байгалийн даавуу, чөлөөт', value: 'warm' },
      { label: 'Классик — цэвэр шугам, элегант', value: 'cool' },
    ],
  },
];

const psychResults: Record<string, {
  type: string;
  subtitle: string;
  desc: string;
  season: string;
  colors: string[];
  tips: string[];
  icon: string;
}> = {
  soft: {
    type: 'Зөөлөн & Романтик',
    subtitle: 'Soft Romantic',
    season: 'Зөөлөн Зун / Зөөлөн Намар',
    desc: 'Та нарийн ширийн зүйлийг мэдэрдэг, дотно уур амьсгалыг бүтээдэг, эелдэг байгалийн хүн. Таны дүр төрх зөөлөн, тайван, гоёмсог байх үед хамгийн тод харагдана.',
    colors: ['#D4A5A5', '#C8B4C8', '#B8C4C8', '#E8D5C4', '#C4B8A8', '#D8C4B8'],
    tips: [
      'Зөөлөн, бүдгэрсэн, тайван өнгийг сонгоорой',
      'Тод тодорхой контраст зайлсхийгээрэй',
      'Даашинз, нарийн хээ, зөөлөн даавуу таарна',
      'Наашга, чулуун эдлэл хамгийн тохирно',
      'Уруулдаа ягаан-хүрэн, нүддээ нил ягаан тень',
    ],
    icon: '🌸',
  },
  bold: {
    type: 'Тод & Өвөрмөц',
    subtitle: 'Bold & Expressive',
    season: 'Тод Өвөл / Тод Хавар',
    desc: 'Та өөрийгөө илэрхийлэх дуртай, бүтээлч сэтгэлгээтэй, тод дүр төрхтэй хүн. Та өнгийг хэрэгсэл болгон ашиглаж, орчноо өөрчилдөг.',
    colors: ['#C41E3A', '#1B1B2F', '#2E4A1E', '#4A1E3E', '#1E3E4A', '#E8C41E'],
    tips: [
      'Тод, ханасан өнгийг айлгүй сонгоорой',
      'Хатуу контраст — хар/цагаан, улаан/хар',
      'Геометрик хэлбэр, тод дизайн таарна',
      'Алт, мөнгөн гоёл чимэглэл',
      'Уруулдаа улаан, нүддэ тод шугам',
    ],
    icon: '✦',
  },
  warm: {
    type: 'Байгалийн & Дулаан',
    subtitle: 'Natural & Warm',
    season: 'Намар / Дулаан Хавар',
    desc: 'Та жинхэнэ, газраас уламжилсан хүч чадалтай хүн. Байгалийн дулаан өнгөнүүд таны арьстай нэгдэж, тод, эрүүл гэрэлтэй харагдуулна.',
    colors: ['#C4956A', '#8B5E3C', '#A67C52', '#C4A882', '#7A5C3A', '#D4B896'],
    tips: [
      'Хүрэн, зэс, улаанхай шар, хуш өнгө',
      'Байгалийн даавуу — маалинга, арьс, тугалга',
      'Байгалийн чулуу, мод, зэс гоёл',
      'Үсэнд хүрэн, улаан өнгийн будаг',
      'Хацар өнгөлөгчид зэс, персик өнгө',
    ],
    icon: '🍂',
  },
  cool: {
    type: 'Нэр хүнд & Тод',
    subtitle: 'Sophisticated & Cool',
    season: 'Өвөл / Зун',
    desc: 'Та тогтвортой, итгэлтэй, мэргэжлийн дүр төрхтэй хүн. Хүйтэн, цэвэр өнгөнүүд таны байгалийн дүр төрхийг тодруулж, нэр хүндтэй харагдуулна.',
    colors: ['#4A6FA5', '#2C3E50', '#7B8B6F', '#5B4A6F', '#2C4A6F', '#8B9BB4'],
    tips: [
      'Хүйтэн цэнхэр, нил ягаан, хар, цагаан',
      'Цэвэр, тодорхой шугамтай хувцас',
      'Мөнгөн, цагаан алт гоёл',
      'Уруулдаа ягаан-улаан, хар ягаан',
      'Нүддэ хар, нил ягаан, хар саарал',
    ],
    icon: '❄️',
  },
};

// ─── Main Data ────────────────────────────────────────────────────────────────
const services = [
  {
    id: 1,
    title: 'Хувийн өнгө тодорхойлох',
    subtitle: 'Personal Color Analysis',
    desc: 'Олон улсын стандартын дагуу таны арьсны өнгө, нүдний болон үсний өнгийг судлан, насан туршид хэрэглэх өнгөний палитрыг тодорхойлно.',
    includes: ['Хувцасны өнгө & хээ', 'Нүүр будалтын шийдэл', 'Хумс & үсний будаг', 'Гоёл чимэглэлийн өнгө', 'Цаасан & дижитал гарын авлага'],
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop&auto=format',
    tag: null,
  },
  {
    id: 2,
    title: 'Нүүр будалтын зөвлөгөө',
    subtitle: 'Makeup Consultation',
    desc: 'Өөрийн makeup-аа авч ирээд, таны өнгөний системд нийцэх хэрэглэлийг мэргэжлийн стилистаас шалгуулж, өдөр тутмын будалт хийж сур.',
    includes: ['Makeup аудит', 'Өнгөний тохирол шалгах', 'Өдөр тутмын будалт сургах', 'Оройн будалтын зөвлөмж'],
    img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop&auto=format',
    tag: null,
  },
  {
    id: 3,
    title: 'Стайлинг зөвлөгөө',
    subtitle: 'Styling Consultation',
    desc: 'Бие галбирт тохирсон хувцас, өмсгөлийн байршил, брэндийн дүр төрхийг бүтцийн аргаар шинжлэн гаргана.',
    includes: ['Биеийн гарааны шинжилгээ', 'Хувцасны зохилдлого', 'Брэнд дүр бүрдүүлэх', 'Дэлгүүр хэсэх гарын авлага'],
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format',
    tag: null,
  },
  {
    id: 4,
    title: 'Сэтгэлзүйн стайл тест',
    subtitle: 'Style Psychology Test',
    desc: 'Таны хувийн шинж чанар, амьдралын хэв маяг, зорилгод нийцэх дүр төрхийг сэтгэл судлалын аргаар тодорхойлно. Тест бөглөөд тайланг и-мэйлээр авна.',
    includes: ['6 асуулт — 5 минут', 'Стайл архетипийн тодорхойлолт', 'Өнгөний палитрын зөвлөмж', 'Хувийн стайлинг зөвлөгөө', 'Тайланг и-мэйлээр авна'],
    img: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&auto=format',
    tag: 'Онлайн',
  },
];

const teamMembers = [
  { name: 'Naruka', role: 'Үндэслэгч & Ахлах Стилист', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=500&fit=crop&auto=format' },
  { name: 'Билгүүн', role: 'Өнгө шинжлэгч', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&auto=format' },
  { name: 'Номин', role: 'Makeup Artist & Стилист', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=500&fit=crop&auto=format' },
  { name: 'Энхцэцэг', role: 'Стайлинг зөвлөх', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop&auto=format' },
];

const galleryItems = [
  { img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=700&fit=crop&auto=format', label: 'Зун улирлын палитр' },
  { img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=400&fit=crop&auto=format', label: 'Warm Autumn' },
  { img: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&h=700&fit=crop&auto=format', label: 'Cool Winter' },
  { img: 'https://images.unsplash.com/photo-1512361436605-a484bdb34b5f?w=600&h=400&fit=crop&auto=format', label: 'Spring Bright' },
  { img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=700&fit=crop&auto=format', label: 'Soft Summer' },
  { img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=400&fit=crop&auto=format', label: 'Deep Autumn' },
];

const testimonials = [
  { name: 'Мөнхцэцэг Б.', text: 'Naruka Studio-д очсоноос хойш хувцасаа огт буруу сонгохоо болилоо. Өнгөний анализ хийлгэсэн нь миний амьдралд хийсэн шилдэг хөрөнгө оруулалт байлаа.', palette: 'Warm Autumn', stars: 5 },
  { name: 'Оюунцэцэг Д.', text: 'Гэрэлтэй, цэмцгэр орчинд мэргэжлийн баг маш нягт нямбай тодорхойлсон. Палитрын гарын авлага нь одоо болтол гар утаснаасаа хэзээ ч хаядаггүй.', palette: 'Cool Winter', stars: 5 },
  { name: 'Энхжаргал С.', text: 'Мэргэжлийн ангид суусан. 2 долоо хоногийн хичээл их нягт агуулгатай байсан. Одоо өөрийн студи нээх замдаа яваа.', palette: 'Мэргэжлийн анги', stars: 5 },
  { name: 'Нарантуяа Ж.', text: 'Би makeup-аа авчирч шалгуулсан. Аль хэрэглэл зохохгүй байгааг ойлгосон нь их хэмнэлттэй боллоо. Зөвлөгөө маш тодорхой, ойлгомжтой байлаа.', palette: 'Soft Summer', stars: 5 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 fill-[#C4956A]" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Psychology Test Modal ────────────────────────────────────────────────────
function PsychTestModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'intro' | 'quiz' | 'email' | 'result'>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);
  const [resultKey, setResultKey] = useState<string>('soft');

  function computeResult(ans: string[]) {
    const counts: Record<string, number> = { soft: 0, bold: 0, warm: 0, cool: 0 };
    ans.forEach(a => { counts[a] = (counts[a] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  function handleAnswer(val: string) {
    setSelected(val);
    setTimeout(() => {
      const newAnswers = [...answers, val];
      if (current + 1 < psychQuestions.length) {
        setAnswers(newAnswers);
        setCurrent(current + 1);
        setSelected(null);
      } else {
        const key = computeResult(newAnswers);
        setResultKey(key);
        setAnswers(newAnswers);
        setStep('email');
        setSelected(null);
      }
    }, 300);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setStep('result'), 1200);
  }

  const result = psychResults[resultKey];
  const progress = ((current) / psychQuestions.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1A18]/70 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#FAF7F2] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Intro */}
        {step === 'intro' && (
          <>
            <div className="bg-[#7A2340] px-8 pt-8 pb-6 text-white relative">
              <button onClick={onClose} className="absolute top-4 right-4 opacity-60 hover:opacity-100 p-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <p className="text-[#C4956A] text-xs tracking-widest uppercase mb-1">Онлайн тест</p>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem' }}>Таны стайл архетипийг<br /><em>олоорой</em></h2>
            </div>
            <div className="px-8 py-8">
              <p className="text-[#3A3330] leading-relaxed mb-6">
                6 асуулт бөглөснөөр таны хувийн стайл архетипийг тодорхойлж, тохирох өнгөний палитр, хувцасны зөвлөгөөг <strong>и-мэйлээр</strong> хүргэнэ.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: '⏱', label: '5 минут' },
                  { icon: '📊', label: '6 асуулт' },
                  { icon: '🎨', label: '4 архетип' },
                  { icon: '📧', label: 'И-мэйл тайлан' },
                ].map(f => (
                  <div key={f.label} className="bg-[#F0EBE3] rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-xl">{f.icon}</span>
                    <span className="text-sm font-medium text-[#3A3330]">{f.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep('quiz')}
                className="w-full py-4 rounded-full bg-[#7A2340] text-white font-semibold hover:bg-[#5C1A30] transition-colors"
              >
                Тест эхлүүлэх →
              </button>
            </div>
          </>
        )}

        {/* Quiz */}
        {step === 'quiz' && (
          <>
            <div className="bg-[#7A2340] px-8 pt-6 pb-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#C4956A] text-xs tracking-widest uppercase">Асуулт {current + 1} / {psychQuestions.length}</p>
                <button onClick={onClose} className="opacity-60 hover:opacity-100 p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-[#C4956A] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="px-8 py-8">
              <h3 className="text-[#1E1A18] mb-6 leading-snug" style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.25rem' }}>
                {psychQuestions[current].q}
              </h3>
              <div className="space-y-3">
                {psychQuestions[current].options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-medium transition-all duration-200 ${
                      selected === opt.value
                        ? 'bg-[#7A2340] border-[#7A2340] text-white scale-[0.99]'
                        : 'bg-white border-[#E8DDD5] text-[#3A3330] hover:border-[#7A2340] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Email capture */}
        {step === 'email' && (
          <>
            <div className="bg-[#7A2340] px-8 pt-8 pb-6 text-white">
              <p className="text-[#C4956A] text-xs tracking-widest uppercase mb-1">Тест дууслаа!</p>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.7rem' }}>Тайланг хаашаа<br /><em>илгээх вэ?</em></h2>
            </div>
            <div className="px-8 py-8">
              {sent ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✉️</div>
                  <p className="font-semibold text-[#1E1A18] text-lg mb-2">Амжилттай илгээлээ!</p>
                  <p className="text-[#8A7F79] text-sm">Тайланг бэлдэж байна...</p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="space-y-4">
                  <p className="text-sm text-[#3A3330] mb-5 leading-relaxed">
                    Таны стайл архетипийн дэлгэрэнгүй тайланг, өнгөний палитрыг и-мэйлээр илгээнэ.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-[#8A7F79] uppercase tracking-wider mb-1.5">Нэр</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Таны нэр"
                      className="w-full px-4 py-3 rounded-xl border border-[#E8DDD5] bg-white focus:outline-none focus:border-[#7A2340] text-[#1E1A18] placeholder:text-[#C4B5AA] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8A7F79] uppercase tracking-wider mb-1.5">И-мэйл хаяг *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-[#E8DDD5] bg-white focus:outline-none focus:border-[#7A2340] text-[#1E1A18] placeholder:text-[#C4B5AA] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-full bg-[#7A2340] text-white font-semibold hover:bg-[#5C1A30] transition-colors mt-2"
                  >
                    Тайланг и-мэйлээр авах
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('result')}
                    className="w-full text-center text-sm text-[#8A7F79] hover:text-[#3A3330] transition-colors py-1"
                  >
                    И-мэйлгүйгээр үр дүнг харах
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        {/* Result */}
        {step === 'result' && (
          <>
            <div className="bg-[#7A2340] px-8 pt-8 pb-6 text-white relative">
              <button onClick={onClose} className="absolute top-4 right-4 opacity-60 hover:opacity-100 p-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <p className="text-[#C4956A] text-xs tracking-widest uppercase mb-2">Таны стайл архетип</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{result.icon}</span>
                <div>
                  <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.7rem' }}>{result.type}</h2>
                  <p className="text-white/70 text-sm">{result.subtitle} · {result.season}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-7 space-y-6">
              {/* Description */}
              <p className="text-[#3A3330] leading-relaxed text-sm">{result.desc}</p>

              {/* Color palette */}
              <div>
                <p className="text-xs font-medium text-[#8A7F79] uppercase tracking-widest mb-3">Таны өнгөний палитр</p>
                <div className="flex gap-2">
                  {result.colors.map((c, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full h-10 rounded-lg shadow-sm" style={{ backgroundColor: c }} />
                      <span className="text-[10px] text-[#8A7F79]">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div>
                <p className="text-xs font-medium text-[#8A7F79] uppercase tracking-widest mb-3">Стайлинг зөвлөгөө</p>
                <ul className="space-y-2.5">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#3A3330]">
                      <span className="w-5 h-5 rounded-full bg-[#7A2340]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="#7A2340" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        </svg>
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="bg-[#F0EBE3] rounded-2xl p-5">
                <p className="text-sm font-semibold text-[#1E1A18] mb-1">Дэлгэрэнгүй тодорхойлуулах уу?</p>
                <p className="text-xs text-[#8A7F79] mb-4 leading-relaxed">
                  Энэ тест нь ерөнхий чиглэл өгнө. Мэргэжлийн алчуур ашиглан биечлэн хийх анализ нь илүү нарийн, насан туршдаа баримтлах палитрыг өгнө.
                </p>
                <a
                  href="tel:86106616"
                  className="block text-center w-full py-3 rounded-full bg-[#7A2340] text-white text-sm font-semibold hover:bg-[#5C1A30] transition-colors"
                >
                  Биечлэн цаг захиалах — 8610 6616
                </a>
              </div>

              {/* Retake */}
              <button
                onClick={() => { setStep('intro'); setCurrent(0); setAnswers([]); setSelected(null); setSent(false); }}
                className="w-full text-center text-sm text-[#8A7F79] hover:text-[#7A2340] transition-colors"
              >
                Тестийг дахин авах ↺
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ view, onClose, onAuth, switchView }: {
  view: AuthView; onClose: () => void; onAuth: (u: User) => void; switchView: (v: AuthView) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Бүх талбарыг бөглөнө үү.'); return; }
    if (view === 'register' && !name) { setError('Нэрээ оруулна уу.'); return; }
    onAuth({ name: name || email.split('@')[0], email });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1A18]/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#FAF7F2] w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#7A2340] px-8 pt-8 pb-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 opacity-60 hover:opacity-100 p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={narukaLogo} alt="Naruka" className="h-10 mb-4 brightness-0 invert opacity-80" />
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem' }}>
            {view === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
          {view === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#8A7F79] uppercase tracking-wider mb-1.5">Нэр</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Таны нэр" className="w-full px-4 py-3 rounded-xl border border-[#E8DDD5] bg-white focus:outline-none focus:border-[#7A2340] text-[#1E1A18] placeholder:text-[#C4B5AA] transition-colors" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[#8A7F79] uppercase tracking-wider mb-1.5">И-мэйл</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-[#E8DDD5] bg-white focus:outline-none focus:border-[#7A2340] text-[#1E1A18] placeholder:text-[#C4B5AA] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8A7F79] uppercase tracking-wider mb-1.5">Нууц үг</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-[#E8DDD5] bg-white focus:outline-none focus:border-[#7A2340] text-[#1E1A18] placeholder:text-[#C4B5AA] transition-colors" />
          </div>
          {error && <p className="text-sm text-[#9B3556]">{error}</p>}
          <button type="submit" className="w-full py-3.5 rounded-xl bg-[#7A2340] text-white font-semibold hover:bg-[#5C1A30] transition-colors mt-2">
            {view === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </button>
          <p className="text-center text-sm text-[#8A7F79] pt-1">
            {view === 'login' ? 'Бүртгэлгүй юу? ' : 'Аль хэдийн бүртгэлтэй? '}
            <button type="button" onClick={() => { setError(''); switchView(view === 'login' ? 'register' : 'login'); }} className="text-[#7A2340] font-semibold hover:underline">
              {view === 'login' ? 'Бүртгүүлэх' : 'Нэвтрэх'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ active, onNav, user, onAuthClick, onLogout }: {
  active: Section; onNav: (s: Section) => void; user: User | null; onAuthClick: () => void; onLogout: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links: { key: Section; label: string }[] = [
    { key: 'home', label: 'Нүүр' },
    { key: 'about', label: 'Бидний тухай' },
    { key: 'services', label: 'Үйлчилгээ' },
    { key: 'training', label: 'Сургалт' },
    { key: 'gallery', label: 'Галерей' },
    { key: 'testimonials', label: 'Сэтгэгдэл' },
    { key: 'contact', label: 'Холбоо барих' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#FAF7F2]/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <button onClick={() => onNav('home')} className="flex items-center">
          <img
            src={narukaLogo}
            alt="Naruka Styling Studio"
            className={`h-10 md:h-12 object-contain transition-all duration-300 ${scrolled ? 'brightness-0' : 'brightness-0 invert'}`}
          />
        </button>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-7">
          {links.map(l => (
            <button key={l.key} onClick={() => onNav(l.key)}
              className={`text-sm transition-colors ${active === l.key
                ? (scrolled ? 'text-[#7A2340] font-semibold' : 'text-white font-semibold')
                : (scrolled ? 'text-[#3A3330] hover:text-[#7A2340]' : 'text-white/80 hover:text-white')
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className={`text-sm ${scrolled ? 'text-[#8A7F79]' : 'text-white/70'}`}>
                Сайн байна уу, <strong className={scrolled ? 'text-[#3A3330]' : 'text-white'}>{user.name}</strong>
              </span>
              <button onClick={onLogout} className="text-sm text-[#7A2340] hover:underline">Гарах</button>
            </div>
          ) : (
            <>
              <button onClick={onAuthClick} className={`text-sm font-medium transition-colors ${scrolled ? 'text-[#3A3330] hover:text-[#7A2340]' : 'text-white/80 hover:text-white'}`}>
                Нэвтрэх
              </button>
              <button onClick={onAuthClick} className="text-sm px-5 py-2 rounded-full bg-[#7A2340] text-white font-medium hover:bg-[#5C1A30] transition-colors">
                Бүртгүүлэх
              </button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="w-5 space-y-1.5">
            <span className={`block h-px transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''} ${scrolled ? 'bg-[#7A2340]' : 'bg-white'}`} />
            <span className={`block h-px transition-all ${menuOpen ? 'opacity-0' : ''} ${scrolled ? 'bg-[#7A2340]' : 'bg-white'}`} />
            <span className={`block h-px transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''} ${scrolled ? 'bg-[#7A2340]' : 'bg-white'}`} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-[#FAF7F2]/98 backdrop-blur-md border-t border-[#E8DDD5] px-6 py-4 space-y-3">
          {links.map(l => (
            <button key={l.key} onClick={() => { onNav(l.key); setMenuOpen(false); }} className="block w-full text-left py-2 text-sm text-[#3A3330] hover:text-[#7A2340] font-medium">
              {l.label}
            </button>
          ))}
          <div className="pt-2 border-t border-[#E8DDD5]">
            {user ? (
              <button onClick={onLogout} className="text-sm text-[#7A2340]">Гарах ({user.name})</button>
            ) : (
              <button onClick={() => { onAuthClick(); setMenuOpen(false); }} className="w-full py-2.5 rounded-full bg-[#7A2340] text-white text-sm font-medium">
                Нэвтрэх / Бүртгүүлэх
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ onBooking, onTest }: { onBooking: () => void; onTest: () => void }) {
  return (
    <section id="home" className="relative min-h-screen flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=1000&fit=crop&auto=format" alt="Fashion styling studio" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1A18]/90 via-[#1E1A18]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#5C1A30]/40 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 md:pb-32 w-full">
        <div className="max-w-2xl">
          <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-6">✦ Улаанбаатар, City Tower</p>
          <h1 className="text-white leading-[1.1] mb-6" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2.8rem, 6vw, 5rem)' }}>
            Өөрийн өнгөөр<br /><em>тод гэрэлт</em>
          </h1>
          <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-lg">
            Мэргэжлийн өнгө тодорхойлох үйлчилгээ. Таны өвөрмөц гоо үзэсгэлэнг нээж, хэзээч өөрчлөгдөхгүй өнгөний палитрыг бүтээнэ.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={onBooking} className="px-8 py-4 rounded-full bg-[#7A2340] text-white font-semibold hover:bg-[#9B3556] transition-all hover:scale-[1.02] active:scale-[0.98]">
              Яг одоо тодорхойлох
            </button>
            <button onClick={onTest} className="px-8 py-4 rounded-full border border-white/40 text-white font-medium hover:bg-white/10 transition-all flex items-center gap-2">
              <span className="text-base">🎨</span> Стайл тест авах
            </button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 hidden md:flex">
        <div className="bg-[#FAF7F2]/95 backdrop-blur-sm px-8 py-6 grid grid-cols-3 gap-8 rounded-tl-2xl">
          {[{ n: '500+', l: 'Үйлчлүүлэгч' }, { n: '4', l: 'Мэргэжилтэн' }, { n: '5★', l: 'Үнэлгээ' }].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-bold text-[#7A2340]" style={{ fontFamily: 'DM Serif Display, serif' }}>{s.n}</div>
              <div className="text-xs text-[#8A7F79] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-3">
            <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=500&fit=crop&auto=format" alt="Studio interior" className="rounded-2xl w-full h-64 object-cover col-span-2" />
            <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop&auto=format" alt="Color drapes" className="rounded-2xl w-full h-40 object-cover" />
            <img src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=300&h=300&fit=crop&auto=format" alt="Consultation" className="rounded-2xl w-full h-40 object-cover" />
          </div>
          <div>
            <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-4">Бидний тухай</p>
            <h2 className="text-[#1E1A18] leading-tight mb-6" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>
              Өнгө — таны хамгийн<br /><em>хүчирхэг хэрэгсэл</em>
            </h2>
            <p className="text-[#3A3330] leading-relaxed mb-4">
              Naruka Styling Studio нь Улаанбаатар хотын City Tower-т байрлах мэргэжлийн стайлинг студи юм. Бид олон улсын стандартын дагуу хувийн өнгө тодорхойлох үйлчилгээг Монгол хүний дүр төрхөнд тохируулан хэрэгжүүлдэг.
            </p>
            <p className="text-[#3A3330] leading-relaxed mb-8">
              Дадлага туршлагатай 4 стилистаас бүрдсэн баг нь таны арьсны өнгө, нүдний болон үсний өнгийг нарийн судлан, насан туршид хэрэглэх өнгөний системийг тодорхойлно.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {['✦ Мэргэжлийн алчуур (drape) ашиглана', '✦ Олон улсын аргачлал', '✦ Цаасан & дижитал гарын авлага', '✦ Makeup аудит боломжтой'].map(h => (
                <div key={h} className="text-sm text-[#3A3330]">{h}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-3">Манай баг</p>
            <h3 className="text-[#1E1A18]" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)' }}>
              Таны өнгийг нээх мэргэжилтнүүд
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {teamMembers.map(m => (
              <div key={m.name} className="group text-center">
                <div className="relative overflow-hidden rounded-2xl mb-4 bg-[#F0EBE3]">
                  <img src={m.img} alt={m.name} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#7A2340]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="font-semibold text-[#1E1A18]" style={{ fontFamily: 'DM Serif Display, serif' }}>{m.name}</div>
                <div className="text-sm text-[#8A7F79] mt-1">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────
function ServicesSection({ onBooking, onTest }: { onBooking: () => void; onTest: () => void }) {
  const [active, setActive] = useState(0);

  return (
    <section id="services" className="py-24 md:py-32 bg-[#F0EBE3]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-3">Үйлчилгээ</p>
          <h2 className="text-[#1E1A18]" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>
            Таны гоо үзэсгэлэнд зориулсан
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {services.map((s, i) => (
            <button key={s.id} onClick={() => setActive(i)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                active === i ? 'bg-[#7A2340] text-white shadow-md' : 'bg-white text-[#3A3330] hover:bg-[#FAF7F2] border border-[#E8DDD5]'
              }`}
            >
              {s.title}
              {s.tag && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${active === i ? 'bg-white/20 text-white' : 'bg-[#7A2340]/10 text-[#7A2340]'}`}>
                  {s.tag}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active panel */}
        {services.map((s, i) => (
          <div key={s.id} className={active === i ? '' : 'hidden'}>
            <div className="grid md:grid-cols-2 gap-0 items-stretch bg-white rounded-3xl overflow-hidden shadow-sm">
              <div className="relative h-72 md:h-auto min-h-[380px] bg-[#F0EBE3]">
                <img src={s.img} alt={s.title} className="w-full h-full object-cover absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                {s.tag && (
                  <div className="absolute top-4 left-4 bg-[#7A2340] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    {s.tag} — Онлайн
                  </div>
                )}
              </div>
              <div className="px-8 py-10 md:pr-12 flex flex-col justify-center">
                <p className="text-[#C4956A] text-xs tracking-widest uppercase mb-2">{s.subtitle}</p>
                <h3 className="text-[#1E1A18] mb-4" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
                  {s.title}
                </h3>
                <p className="text-[#3A3330] leading-relaxed mb-6">{s.desc}</p>
                <ul className="space-y-2.5 mb-8">
                  {s.includes.map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#3A3330]">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-[#7A2340]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#7A2340" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                {s.id === 4 ? (
                  <button onClick={onTest} className="px-7 py-3.5 rounded-full bg-[#7A2340] text-white font-semibold hover:bg-[#5C1A30] transition-colors w-fit flex items-center gap-2">
                    <span>🎨</span> Онлайн тест авах
                  </button>
                ) : (
                  <button onClick={onBooking} className="px-7 py-3.5 rounded-full bg-[#7A2340] text-white font-semibold hover:bg-[#5C1A30] transition-colors w-fit">
                    Яг одоо тодорхойлох
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Psych test callout */}
        <div className="mt-8 bg-gradient-to-r from-[#7A2340] to-[#9B3556] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="text-4xl">🎨</div>
            <div>
              <p className="text-[#D4AA84] text-xs font-medium tracking-widest uppercase mb-1">Шинэ — Онлайн</p>
              <h4 className="text-white font-semibold text-lg" style={{ fontFamily: 'DM Serif Display, serif' }}>
                Сэтгэлзүйн стайл тест
              </h4>
              <p className="text-white/70 text-sm">6 асуултаар стайл архетипаа тодорхойл — үр дүнг и-мэйлээр авна</p>
            </div>
          </div>
          <button
            onClick={onTest}
            className="flex-shrink-0 px-7 py-3.5 rounded-full bg-[#C4956A] text-white font-semibold hover:bg-[#D4AA84] hover:text-[#1E1A18] transition-all"
          >
            Тест эхлүүлэх →
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Training ─────────────────────────────────────────────────────────────────
function TrainingSection() {
  return (
    <section id="training" className="py-24 md:py-32 bg-[#7A2340] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C4956A] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#C4956A] blur-3xl" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-4">Мэргэжлийн анги</p>
            <h2 className="leading-tight mb-6" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>
              Өөрийн стайлинг<br /><em>бизнесээ эхлүүл</em>
            </h2>
            <p className="text-white/80 leading-relaxed mb-6">
              Онол, практикийг хослуулсан 2 долоо хоногийн мэргэжлийн сургалт. Хувийн өнгө тодорхойлох, makeup, стайлинг зөвлөгөөний бүх мэдлэгийг эзэмшин өөрийн үйлчилгээгээ нээх боломжтой.
            </p>
            <div className="bg-[#C4956A]/20 border border-[#C4956A]/40 rounded-2xl px-5 py-4 mb-8">
              <p className="text-[#D4AA84] text-sm font-semibold mb-1">⚡ Элсэлт хаагдах гэж байна</p>
              <p className="text-white/80 text-sm">Эхлэх огноо: <strong>9-р сарын 28</strong>. Элсэлт <strong>9-р сарын 25</strong>-нд хаагдана. Бүртгэлийн утас: <strong>8610 6616</strong></p>
            </div>
            <a href="tel:86106616" className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#C4956A] text-white font-semibold hover:bg-[#D4AA84] hover:text-[#1E1A18] transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              Бүртгэлийн утас руу залгах
            </a>
          </div>
          <div className="space-y-4">
            {[
              { n: '01', title: 'Өнгөний онол', desc: 'Өнгөний дугуй, температур, гүн гэрэлтэй байдал, хуурмаг болон жинхэнэ өнгө' },
              { n: '02', title: 'Хувийн өнгө тодорхойлох', desc: 'Алчуур ашиглан практик тодорхойлолт, 4 улирлын систем' },
              { n: '03', title: 'Makeup & гоо сайхан', desc: 'Өнгөний системтэй нийцсэн makeup бүтээх, хэрэглэгчид зааж сургах' },
              { n: '04', title: 'Бизнес эрхлэлт', desc: 'Үйлчилгээ тогтоох, харилцагч татах, брэнд бүтээх' },
            ].map(c => (
              <div key={c.n} className="flex gap-5 bg-white/10 rounded-2xl px-5 py-4 hover:bg-white/15 transition-colors">
                <span className="text-[#C4956A] font-bold text-lg flex-shrink-0" style={{ fontFamily: 'DM Serif Display, serif' }}>{c.n}</span>
                <div>
                  <div className="font-semibold mb-1">{c.title}</div>
                  <div className="text-white/70 text-sm">{c.desc}</div>
                </div>
              </div>
            ))}
            <div className="bg-white/10 rounded-2xl px-5 py-4">
              <div className="text-[#C4956A] text-xs font-medium tracking-widest uppercase mb-3">Хуваарь</div>
              {[{ day: 'Даваа – Баасан', time: '12:00 · 3–5 цаг' }, { day: '2 долоо хоног нийт', time: 'Шинэчлэгдсэн хөтөлбөр' }].map(s => (
                <div key={s.day} className="flex justify-between items-center text-sm py-1.5 border-b border-white/10 last:border-0">
                  <span className="text-white/80">{s.day}</span>
                  <span className="font-medium">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
function GallerySection() {
  const [lightbox, setLightbox] = useState<string | null>(null);
  return (
    <section id="gallery" className="py-24 md:py-32 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-3">Галерей</p>
          <h2 className="text-[#1E1A18]" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Өнгөний ертөнц</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {galleryItems.map((item, i) => (
            <div key={i} className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-[#F0EBE3] ${i % 3 === 0 ? 'row-span-2' : ''}`} onClick={() => setLightbox(item.img)}>
              <img src={item.img} alt={item.label} className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${i % 3 === 0 ? 'h-[400px] md:h-[520px]' : 'h-[200px] md:h-[250px]'}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1A18]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                <span className="text-white text-sm font-medium">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 md:py-32 bg-[#F0EBE3]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-3">Сэтгэгдэл</p>
          <h2 className="text-[#1E1A18]" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Үйлчлүүлэгчдийн хэлсэн үг</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 hover:shadow-md transition-shadow">
              <StarRating count={t.stars} />
              <p className="text-[#3A3330] leading-relaxed my-5 text-[0.95rem]">"{t.text}"</p>
              <div className="flex items-center justify-between border-t border-[#F0EBE3] pt-4">
                <div className="font-semibold text-[#1E1A18] text-sm">{t.name}</div>
                <span className="text-xs text-[#C4956A] bg-[#FAF7F2] border border-[#E8DDD5] px-3 py-1 rounded-full font-medium">{t.palette}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a href="https://facebook.com/narukastylingstudio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-[#7A2340] font-semibold hover:underline">
            <svg className="w-4 h-4 fill-[#7A2340]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            Facebook дээр дэлгэрэнгүй сэтгэгдэл үзэх — 8.1K дагагч
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function ContactSection({ onBooking }: { onBooking: () => void }) {
  return (
    <section id="contact" className="py-24 md:py-32 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-3">Холбоо барих</p>
          <h2 className="text-[#1E1A18]" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Бидэнтэй холбогдох</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-14">
          {[
            { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />, title: 'Байршил', content: <p className="text-sm text-[#3A3330] leading-relaxed">City Tower, 20-р давхар, 2002 тоот<br />Талбайн зүүн тал<br />Улаанбаатар 14200</p> },
            { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />, title: 'Утас', content: <><a href="tel:86106616" className="text-sm text-[#7A2340] font-semibold hover:underline">8610 6616</a><p className="text-sm text-[#8A7F79] mt-1">Цаг захиалга, сургалтын бүртгэл</p></> },
            { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />, title: 'И-мэйл & Сошиал', content: <><a href="mailto:naruka.stylingstudio@gmail.com" className="text-sm text-[#7A2340] hover:underline block mb-2 break-all">naruka.stylingstudio@gmail.com</a><a href="https://facebook.com/narukastylingstudio" target="_blank" rel="noopener noreferrer" className="text-sm text-[#3A3330] hover:text-[#7A2340] flex items-center gap-1.5"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>Facebook · 8.1K дагагч</a></> },
          ].map((card, ci) => (
            <div key={ci} className="bg-[#F0EBE3] rounded-3xl p-7">
              <div className="w-10 h-10 rounded-full bg-[#7A2340]/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#7A2340]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{card.icon}</svg>
              </div>
              <h4 className="font-semibold text-[#1E1A18] mb-2">{card.title}</h4>
              {card.content}
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-3xl overflow-hidden bg-[#F0EBE3] h-72">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2673.5!2d106.9057!3d47.9077!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5d96924e21a0e0b5%3A0x123456!2sCity+Tower%2C+Ulaanbaatar!5e0!3m2!1sen!2smn!4v1695000000000!5m2!1sen!2smn" width="100%" height="100%" style={{ border: '0' }} allowFullScreen loading="lazy" title="Naruka Studio байршил" />
          </div>
          <div className="bg-[#7A2340] rounded-3xl p-10 flex flex-col justify-center text-white">
            <p className="text-[#C4956A] text-xs font-medium tracking-[0.4em] uppercase mb-4">Яг одоо тодорхойлох</p>
            <h3 className="leading-tight mb-4" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
              Өнгөний аяллаа<br /><em>өнөөдөр эхлүүл</em>
            </h3>
            <p className="text-white/80 text-sm mb-8 leading-relaxed">
              Насан туршид хэрэглэх өнгөний системийг нэг удаа тодорхойлоод хувцас, makeup, гоёл чимэглэл бүгдийг зөв сонгох болно.
            </p>
            <button onClick={onBooking} className="px-8 py-4 rounded-full bg-[#C4956A] text-white font-semibold hover:bg-[#D4AA84] hover:text-[#1E1A18] transition-all w-fit">
              Яг одоо тодорхойлох →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
function BookingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1A18]/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#7A2340] px-8 py-6 text-white flex items-center justify-between">
          <div>
            <img src={narukaLogo} alt="Naruka" className="h-8 mb-2 brightness-0 invert opacity-80" />
            <h3 className="text-xl" style={{ fontFamily: 'DM Serif Display, serif' }}>Яг одоо тодорхойлох</h3>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-8 py-8 space-y-4">
          <p className="text-[#3A3330] text-sm leading-relaxed">Өнгөний анализаа яг одоо эхлүүлэхийн тулд доорх аргаар холбогдоно уу:</p>
          {[
            { href: 'tel:86106616', label: '8610 6616 — Утасны захиалга', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />, primary: true },
            { href: 'mailto:naruka.stylingstudio@gmail.com', label: 'И-мэйлээр захиалах', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />, primary: false },
          ].map(l => (
            <a key={l.href} href={l.href} className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl font-semibold transition-colors ${l.primary ? 'bg-[#7A2340] text-white hover:bg-[#5C1A30]' : 'border border-[#E8DDD5] bg-white text-[#3A3330] hover:border-[#7A2340]'}`}>
              <svg className={`w-5 h-5 ${l.primary ? '' : 'text-[#7A2340]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{l.icon}</svg>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ onNav }: { onNav: (s: Section) => void }) {
  return (
    <footer className="bg-[#1E1A18] text-white py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <img src={narukaLogo} alt="Naruka Styling Studio" className="h-14 mb-4 brightness-0 invert opacity-90" />
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              ✨ Өөрийн өнгөөр тод гэрэлт ✨<br />
              Мэргэжлийн хувийн өнгө тодорхойлох үйлчилгээ. City Tower, Улаанбаатар.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-4">Хуудас</h5>
            <ul className="space-y-2">
              {(['about', 'services', 'training', 'gallery', 'testimonials', 'contact'] as Section[]).map(s => (
                <li key={s}>
                  <button onClick={() => onNav(s)} className="text-sm text-white/70 hover:text-white transition-colors">
                    {s === 'about' ? 'Бидний тухай' : s === 'services' ? 'Үйлчилгээ' : s === 'training' ? 'Сургалт' : s === 'gallery' ? 'Галерей' : s === 'testimonials' ? 'Сэтгэгдэл' : 'Холбоо барих'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-4">Холбоо</h5>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="tel:86106616" className="hover:text-white">8610 6616</a></li>
              <li><a href="mailto:naruka.stylingstudio@gmail.com" className="hover:text-white break-all">naruka.stylingstudio@gmail.com</a></li>
              <li><a href="https://facebook.com/narukastylingstudio" target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a></li>
              <li className="text-white/40 text-xs pt-2">City Tower 20F · 2002 тоот</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-wrap gap-4 items-center justify-between text-xs text-white/40">
          <span>© 2024 Naruka Styling Studio. Бүх эрх хуулиар хамгаалагдсан.</span>
          <span>Fashion Stylist · Улаанбаатар, Монгол</span>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const ids: Section[] = ['home', 'about', 'services', 'training', 'gallery', 'testimonials', 'contact'];
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id as Section); });
    }, { threshold: 0.3 });
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  function handleNav(section: Section) {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <Navbar active={activeSection} onNav={handleNav} user={user} onAuthClick={() => { setAuthView('login'); setAuthOpen(true); }} onLogout={() => setUser(null)} />

      <HeroSection onBooking={() => setBookingOpen(true)} onTest={() => setTestOpen(true)} />
      <AboutSection />
      <ServicesSection onBooking={() => setBookingOpen(true)} onTest={() => setTestOpen(true)} />
      <TrainingSection />
      <GallerySection />
      <TestimonialsSection />
      <ContactSection onBooking={() => setBookingOpen(true)} />
      <Footer onNav={handleNav} />

      {authOpen && <AuthModal view={authView} onClose={() => setAuthOpen(false)} onAuth={u => { setUser(u); setAuthOpen(false); }} switchView={v => setAuthView(v)} />}
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
      {testOpen && <PsychTestModal onClose={() => setTestOpen(false)} />}
    </div>
  );
}
