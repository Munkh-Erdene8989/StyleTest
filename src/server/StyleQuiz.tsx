'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Answer = {
  value: string | string[] | number;
  label: string;
  insight: string;
};

type Answers = Record<string, Answer>;

type Option = {
  value: string;
  label: string;
  insight: string;
  emoji?: string;
  color?: string;
  image?: string;
};

const STORAGE_KEY = 'naruka-style-quiz';
const CHECKOUT_KEY = 'naruka-style-quiz-checkout';

type Checkout = {
  id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  email: string;
  qrImage?: string;
  urls: { name: string; link: string; logo?: string }[];
  simulate: boolean;
};

const photos = {
  ages: ['/quiz/age-18-25.jpg', '/quiz/age-26-35.jpg', '/quiz/age-36-55.jpg', '/quiz/age-55.jpg'],
  customers: [
    'https://images.unsplash.com/photo-1713528757748-86793bac3744?w=500&h=500&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1631821657340-b07983bfc5f9?w=500&h=500&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1713528757853-6aa66778a912?w=500&h=500&fit=crop&auto=format',
  ],
  testimonial: 'https://images.unsplash.com/photo-1701844778533-f46d8092ebe1?w=500&h=600&fit=crop&auto=format',
  before: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=900&fit=crop&auto=format',
  after: 'https://images.unsplash.com/photo-1756700414056-ec050f39d199?w=700&h=900&fit=crop&auto=format',
  demo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&h=560&fit=crop&auto=format',
};

const steps = [
  'age', 'proof', 'feel', 'feelEcho', 'clarity', 'confidence', 'hardest', 'shopping',
  'beforeAfter', 'shops', 'budget', 'unused', 'budgetHelp', 'wardrobeSlider',
  'relate', 'climate', 'measurements', 'comfort', 'agree', 'demo', 'eye', 'hair',
  'hairLength', 'skin', 'undertone', 'bodyShape', 'preference', 'occasions',
  'colors', 'outfits', 'reviews', 'compliment', 'unlock', 'photo', 'great', 'email',
  'loader', 'results', 'paywall',
] as const;

type Step = typeof steps[number];

const basicQuestions: Partial<Record<Step, { eyebrow: string; title: string; subtitle?: string; options: Option[]; multi?: boolean }>> = {
  feel: {
    eyebrow: 'Таны зорилго',
    title: 'Хувцас тань танд ямар мэдрэмж төрүүлээсэй гэж хүсдэг вэ?',
    subtitle: 'Танд нийцэх бүх хариултыг сонгоорой.',
    multi: true,
    options: [
      { emoji: '✦', label: 'Өөртөө итгэлтэй', value: 'confident', insight: 'Таны стайл өөртөө итгэх мэдрэмжийг өдөр бүр дэмжих ёстой.' },
      { emoji: '◌', label: 'Тайван, тухтай', value: 'comfortable', insight: 'Зөөлөн бүтэц, амархан хослох хувцас танд эрх чөлөө өгнө.' },
      { emoji: '◇', label: 'Гоёмсог, эмэгтэйлэг', value: 'elegant', insight: 'Нарийн силуэт, уян материал таны эмэгтэйлэг төрхийг тодруулна.' },
      { emoji: '↑', label: 'Хүчирхэг, цэгцтэй', value: 'powerful', insight: 'Цэвэр шугам, бүтэцтэй эсгүүр таны нөлөөг нэмэгдүүлнэ.' },
      { emoji: '☀', label: 'Шинэлэг, гэрэлтсэн', value: 'fresh', insight: 'Тод акцент, шинэ хослол танд эрч хүч өгнө.' },
    ],
  },
  clarity: {
    eyebrow: 'Таны одоогийн туршлага',
    title: 'Өөрт зохих өнгө, хувцсаа сонгохдоо хэр итгэлтэй вэ?',
    options: [
      { label: 'Яг юу зохидгийг сайн мэднэ', value: 'clear', insight: 'Таны мэдрэмж сайн хөгжсөн — одоо түүнийг нарийн систем болгоё.' },
      { label: 'Заримдаа л зөв сонгодог', value: 'sometimes', insight: 'Танд хэдхэн тодорхой дүрэм нэмэгдэхэд сонголт маш амар болно.' },
      { label: 'Ихэнхдээ эргэлздэг', value: 'unsure', insight: 'Таны өнгө, хэлбэрийн зураглал эргэлзээг итгэл болгон хувиргана.' },
      { label: 'Огт мэдэхгүй санагддаг', value: 'lost', insight: 'Бид хамгийн энгийн алхмаас эхэлж, танд ойлгомжтой систем бүтээнэ.' },
    ],
  },
  confidence: {
    eyebrow: 'Таны хувцасны шүүгээ',
    title: 'Одоогийн хувцаснуудаа өмсөхөд ямар санагддаг вэ?',
    options: [
      { label: 'Надад яг тохирдог', value: 'great', insight: 'Таны суурь сайн байна — хамгийн хүчтэй хэсгийг нь улам тодруулъя.' },
      { label: 'Зарим өдөр гоё, зарим өдөр биш', value: 'mixed', insight: 'Тогтвортой хэдэн томьёо таны “гоё өдөр”-ийг олшруулна.' },
      { label: 'Нэг л уйтгартай', value: 'boring', insight: 'Танд шинэ хувцаснаас илүү зөв акцент, өнгө хэрэгтэй байж магадгүй.' },
      { label: 'Надад өөрийн мэт санагддаггүй', value: 'not-me', insight: 'Таны амьдрал, зан чанарт нийцсэн шинэ стайлын хэл бий.' },
    ],
  },
  hardest: {
    eyebrow: 'Саад бэрхшээл',
    title: 'Хувцаслахад хамгийн хэцүү зүйл юу вэ?',
    subtitle: 'Олон хариулт сонгож болно.',
    multi: true,
    options: [
      { label: 'Өнгө хослуулах', value: 'matching', insight: 'Хувийн палитр өнгө хослуулах хугацааг эрс богиносгоно.' },
      { label: 'Биеийн хэлбэртээ тохируулах', value: 'fit', insight: 'Зөв пропорц биеийг нуух биш, тэнцвэртэй харагдуулдаг.' },
      { label: 'Өглөө юу өмсөхөө шийдэх', value: 'morning', insight: 'Бэлэн outfit томьёо өглөөг илүү хялбар болгоно.' },
      { label: 'Трендийг өөртөө тохируулах', value: 'trends', insight: 'Тренд бүрийг дагахгүйгээр өөрийн стайлд шингээж болно.' },
    ],
  },
  shopping: {
    eyebrow: 'Shopping хэв маяг',
    title: 'Дэлгүүр хэсэхэд танд ихэвчлэн ямар санагддаг вэ?',
    multi: true,
    options: [
      { emoji: '♡', label: 'Сонирхолтой, хөгжилтэй', value: 'fun', insight: 'Таны сониуч занг ухаалаг сонголтын жагсаалттай хослуулъя.' },
      { emoji: '…', label: 'Хэт олон сонголттой', value: 'overwhelmed', insight: 'Тодорхой палитр сонголтын ачааллыг мэдэгдэхүйц багасгана.' },
      { emoji: '₮', label: 'Мөнгө үрсэн мэт', value: 'waste', insight: 'Олон хувцас биш, хоорондоо ажилладаг цөөн зүйл танд хэрэгтэй.' },
      { emoji: '?', label: 'Юунаас эхлэхээ мэдэхгүй', value: 'confused', insight: 'Хувийн жагсаалттай бол дэлгүүр хэсэх нь зорилготой болно.' },
    ],
  },
  shops: {
    eyebrow: 'Таны зуршил',
    title: 'Та ихэвчлэн хаанаас хувцас авдаг вэ?',
    options: [
      { label: 'Олон улсын fast fashion брэнд', value: 'fast-fashion', insight: 'Суурь загварыг чанартай акценттай хослуулах нь танд ашигтай.' },
      { label: 'Монгол брэнд, дизайнер', value: 'local', insight: 'Орон нутгийн өвөрмөц загвар таны дүр төрхийг мартагдашгүй болгоно.' },
      { label: 'Онлайн дэлгүүр', value: 'online', insight: 'Хэмжээ, өнгөний шалгах жагсаалт онлайн алдааг багасгана.' },
      { label: 'Хольж авдаг', value: 'mixed', insight: 'Төрөл бүрийн брэндийг нэг палитраар холбоход шүүгээ цэгцэрнэ.' },
    ],
  },
  budget: {
    eyebrow: 'Ухаалаг хөрөнгө оруулалт',
    title: 'Нэг улиралд хувцсанд ойролцоогоор хэдийг зарцуулдаг вэ?',
    options: [
      { label: '300,000₮ хүртэл', value: 'under-300', insight: 'Жижиг төсөвт хамгийн олон хослол гаргах суурь хувцас чухал.' },
      { label: '300,000–700,000₮', value: '300-700', insight: 'Төсвөө суурь, акцент, аксессуар гэсэн 3 хэсэгт хуваавал үр дүнтэй.' },
      { label: '700,000–1,500,000₮', value: '700-1500', insight: 'Чанар, давтамжийг зэрэг тооцвол хөрөнгө оруулалт тань урт настай болно.' },
      { label: '1,500,000₮-с дээш', value: 'over-1500', insight: 'Онцгой худалдан авалт бүр таны стайлын түүхийг дэмжих хэрэгтэй.' },
    ],
  },
  unused: {
    eyebrow: 'Шүүгээний бодит байдал',
    title: 'Өмсөлгүй үлдээдэг худалдан авалт хэр олон байдаг вэ?',
    options: [
      { label: 'Бараг байдаггүй', value: 'rare', insight: 'Та худалдан авалтаа сайн хянадаг — үүнийг төгс систем болгоё.' },
      { label: '5-аас 1 орчим', value: 'some', insight: 'Хэдхэн шалгуур импульс худалдан авалтыг зогсооно.' },
      { label: '3-аас 1 орчим', value: 'often', insight: 'Өнгө, эсгүүрийн хувийн жагсаалт танд бодит хэмнэлт өгнө.' },
      { label: 'Бараг тал нь', value: 'half', insight: 'Шүүгээний аудит хамгийн хурдан өөрчлөлт авчрах эхний алхам.' },
    ],
  },
  budgetHelp: {
    eyebrow: 'Таны төлөвлөгөө',
    title: 'Төсвөө илүү үр ашигтай зарцуулахад тусламж авах уу?',
    options: [
      { label: 'Тийм, надад яг хэрэгтэй', value: 'yes', insight: 'Танд худалдан авалтын эрэмбэлсэн төлөвлөгөө хамгийн их үнэ цэн өгнө.' },
      { label: 'Магадгүй, эхлээд үр дүнгээ харъя', value: 'maybe', insight: 'Таны тайланд эхлэхэд хангалттай энгийн зөвлөмж орно.' },
      { label: 'Үгүй, би төсвөө сайн удирддаг', value: 'no', insight: 'Сайн зуршил дээр тань илүү нарийн стайлын стратеги нэмье.' },
    ],
  },
  agree: {
    eyebrow: 'Өөрийгөө илэрхийлэх нь',
    title: '“Миний хувцас намайг үг хэлэхээс өмнө илэрхийлэх ёстой.”',
    options: [
      { label: 'Бүрэн санал нийлнэ', value: 'strongly-agree', insight: 'Таны хувьд стайл бол хүчтэй, санаатай харилцааны хэл юм.' },
      { label: 'Санал нийлнэ', value: 'agree', insight: 'Таны төрх зан чанарыг зөөлөн боловч тод илэрхийлж чадна.' },
      { label: 'Эргэлзэж байна', value: 'neutral', insight: 'Танд эвтэйхэн, байгалийн санагдах илэрхийллийг хамт олъё.' },
      { label: 'Санал нийлэхгүй', value: 'disagree', insight: 'Тав тух, практик байдал таны хувийн стайлын гол үнэ цэн байж болно.' },
    ],
  },
  preference: {
    eyebrow: 'Таны стайлын чиглэл',
    title: 'Аль төрлийн хувцас танд хамгийн ойр вэ?',
    options: [
      { label: 'Минимал, цэвэр шугамтай', value: 'minimal', insight: 'Нарийн эсгүүр, цөөн хүчтэй өнгө таны төрхийг дэмжинэ.' },
      { label: 'Классик, гоёмсог', value: 'classic', insight: 'Чанартай суурь загвар, тэнцвэртэй пропорц танд тохирно.' },
      { label: 'Романтик, зөөлөн', value: 'romantic', insight: 'Уян материал, зөөлөн деталь таны байгалийн илэрхийлэл.' },
      { label: 'Бүтээлч, өвөрмөц', value: 'creative', insight: 'Тод акцент, санаандгүй хослол таны энергийг харуулна.' },
      { label: 'Casual, тухтай', value: 'casual', insight: 'Тав тухыг алдалгүй цэгцтэй харагдах давхарлалт танд зохино.' },
    ],
  },
  occasions: {
    eyebrow: 'Амьдралын мөчүүд',
    title: 'Аль үед хувцас сонгох хамгийн хэцүү вэ?',
    multi: true,
    options: [
      { label: 'Өдөр тутмын ажил', value: 'work', insight: 'Ажлын 3–5 бэлэн томьёо өглөөг тань хөнгөвчилнө.' },
      { label: 'Уулзалт, илтгэл', value: 'meeting', insight: 'Бүтэцтэй силуэт таны итгэлийг шууд нэмэгдүүлнэ.' },
      { label: 'Баяр, хурим', value: 'event', insight: 'Онцгой мөчид өнгө, гялбааны тэнцвэр хамгийн чухал.' },
      { label: 'Болзоо, оройн гаргалт', value: 'date', insight: 'Таныг өөрийнхөөрөө мэдрүүлэх эмэгтэйлэг акцент хамгийн зөв.' },
      { label: 'Амралт, аялал', value: 'travel', insight: 'Цөөн зүйлээр олон төрх гаргах capsule төлөвлөгөө танд тохирно.' },
    ],
  },
  compliment: {
    eyebrow: 'Таны гэрэл',
    title: 'Таны хувцаслалтыг хамгийн сүүлд хэзээ магтсан бэ?',
    options: [
      { label: 'Энэ долоо хоногт', value: 'week', insight: 'Тэр өдрийн өнгө, силуэт таны хүчтэй томьёоны нэг байна.' },
      { label: 'Сүүлийн сард', value: 'month', insight: 'Танд ажилладаг төрх бий — бид түүнийг давтагдах систем болгоно.' },
      { label: 'Нэлээд удсан', value: 'long', insight: 'Зөв өнгө, пропорц таны гэрлийг дахин хурдан тодруулна.' },
      { label: 'Санахгүй байна', value: 'never', insight: 'Таны шинэ төрх хамгийн түрүүнд өөрт тань сайхан мэдрэмж өгөх болно.' },
    ],
  },
};

const swatches: Record<'eye' | 'hair' | 'skin', Option[]> = {
  eye: [
    ['black', 'Хар', '#211B18'], ['dark-brown', 'Хар хүрэн', '#3D2B24'], ['brown', 'Хүрэн', '#634638'],
    ['amber', 'Зөгийн бал', '#A66F3F'], ['hazel', 'Hazel', '#77714B'], ['olive', 'Олив', '#666641'],
    ['green', 'Ногоон', '#66806A'], ['grey-green', 'Саарал ногоон', '#80928B'], ['grey', 'Саарал', '#8A9297'],
    ['blue-grey', 'Цэнхэр саарал', '#7791A3'], ['blue', 'Цэнхэр', '#6689A5'], ['light-blue', 'Цайвар цэнхэр', '#9EC1D2'],
  ].map(([value, label, color]) => ({ value, label, color, insight: `${label} нүдийг тань тодруулах өнгийг палитрын акцент хэсэгт оруулна.` })),
  hair: [
    ['black', 'Хар', '#191817'], ['espresso', 'Эспрессо', '#30231F'], ['dark-brown', 'Хар хүрэн', '#48342C'],
    ['brown', 'Хүрэн', '#664A3B'], ['chestnut', 'Туулайн бөөр', '#814B36'], ['auburn', 'Улаан хүрэн', '#8D4935'],
    ['copper', 'Зэс', '#A85E3C'], ['dark-blonde', 'Хар шаргал', '#8D785F'], ['gold-blonde', 'Алтан шаргал', '#B79B6B'],
    ['ash-blonde', 'Үнсэн шаргал', '#B2A691'], ['grey', 'Саарал', '#AAA9A4'], ['white', 'Цагаан', '#E8E3DA'],
  ].map(([value, label, color]) => ({ value, label, color, insight: `${label} үсний контрасттай зохицох хувцасны гүн өнгийг тооцооллоо.` })),
  skin: [
    ['porcelain', 'Шаазан', '#F6D8C4'], ['ivory', 'Ivory', '#F2CEAE'], ['fair', 'Цайвар', '#E9BE9E'],
    ['light', 'Цайвар шаргал', '#DFAF8C'], ['beige', 'Beige', '#D29A75'], ['golden', 'Алтан', '#C68A62'],
    ['tan', 'Бор шаргал', '#B97750'], ['honey', 'Зөгийн бал', '#A96846'], ['caramel', 'Caramel', '#94593E'],
    ['brown', 'Бор', '#7D4936'], ['deep', 'Гүн бор', '#63392F'], ['dark', 'Хар бор', '#442A25'],
  ].map(([value, label, color]) => ({ value, label, color, insight: `${label} арьсны өнгийг жигд, гэрэлтсэн харагдуулах палитр сонгоно.` })),
};

const outfitOptions = [
  { value: 'boho', label: 'Boho', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1000&fit=crop&auto=format', insight: 'Boho төрхөд таны дуртай эсэх нь бүтэц, эрх чөлөөний хэрэгцээг харуулна.' },
  { value: 'classic', label: 'Classic', image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&h=1000&fit=crop&auto=format', insight: 'Classic төрх таны цэгцтэй, удаан хэрэглэгдэх сонголтыг илтгэнэ.' },
  { value: 'denim', label: 'Casual denim', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1000&fit=crop&auto=format', insight: 'Casual denim-д өгсөн үнэлгээ тав тух ба polish-ийн тэнцвэрийг тодорхойлно.' },
  { value: 'romantic', label: 'Romantic floral', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop&auto=format', insight: 'Romantic төрх зөөлөн детальтай хэр холбоотойг тань харуулна.' },
  { value: 'evening', label: 'Evening', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1000&fit=crop&auto=format', insight: 'Evening төрхийн үнэлгээ таны драматик контрастын хэмжээг хэлж өгнө.' },
];

function PrimaryButton({ children, onClick, disabled = false, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit';
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="group w-full rounded-full bg-bordeaux px-6 py-4 font-semibold text-white shadow-lg shadow-bordeaux/15 transition-all hover:-translate-y-0.5 hover:bg-bordeaux-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">
      <span className="flex items-center justify-center gap-2">{children}<span className="transition-transform group-hover:translate-x-1">→</span></span>
    </button>
  );
}

function OptionGrid({ options, selected, onSelect, multi = false, visual = false, twoColumns = false }: {
  options: Option[]; selected: string[]; onSelect: (option: Option) => void; multi?: boolean; visual?: boolean; twoColumns?: boolean;
}) {
  return (
    <div className={`grid gap-3 sm:gap-4 ${twoColumns ? 'grid-cols-2' : visual ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {options.map(option => {
        const active = selected.includes(option.value);
        return (
          <button
            type="button"
            key={option.value}
            onClick={() => onSelect(option)}
            className={`group relative overflow-hidden rounded-3xl border text-left transition-all duration-300 ${
              active
                ? 'border-bordeaux bg-bordeaux text-white shadow-lg shadow-bordeaux/15 ring-2 ring-bordeaux/10'
                : 'border-[#E8DDD5] bg-white text-charcoal-soft shadow-sm hover:-translate-y-1 hover:border-gold hover:shadow-lg'
            } ${visual ? 'min-h-28 p-2.5 sm:p-3' : 'p-4 sm:p-5'}`}
          >
            {option.image && <div className="relative mb-3 overflow-hidden rounded-2xl"><img src={option.image} alt={option.label} className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-charcoal/15 to-transparent" /></div>}
            {option.color && <span className="mb-3 block h-14 w-full rounded-2xl border border-black/5 shadow-inner" style={{ backgroundColor: option.color }} />}
            <span className="flex items-center gap-3 text-sm font-semibold">
              {option.emoji && <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-lg ${active ? 'bg-white/15' : 'bg-cream-dark text-bordeaux'}`}>{option.emoji}</span>}
              <span>{option.label}</span>
              {multi && <span className={`ml-auto flex size-5 items-center justify-center rounded-full border ${active ? 'border-white bg-white text-bordeaux' : 'border-[#D7C8BE]'}`}>{active ? '✓' : ''}</span>}
            </span>
            {!multi && active && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-white text-sm font-bold text-bordeaux shadow">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function ExpertInsight({ text }: { text: string }) {
  return (
    <div className="mt-5 flex gap-3 rounded-2xl bg-cream-dark p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bordeaux font-[family-name:var(--font-display)] text-white">N</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-bordeaux">Nora · Стилист</p>
        <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">{text}</p>
      </div>
    </div>
  );
}

export default function StyleQuiz({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [outfitIndex, setOutfitIndex] = useState(0);
  const [outfitRatings, setOutfitRatings] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [slider, setSlider] = useState(50);
  const [photoName, setPhotoName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const step = steps[index];
  const ready = useRef(false);

  function close() {
    if (onClose) onClose();
    else router.push('/');
  }

  useEffect(() => {
    if (!ready.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step: index, name, email, updatedAt: new Date().toISOString() }));
  }, [answers, index, name, email]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as { answers?: Answers; name?: string; email?: string; step?: number };
      if (saved.answers && typeof saved.answers === 'object') setAnswers(saved.answers);
      if (typeof saved.name === 'string') setName(saved.name);
      if (typeof saved.email === 'string') setEmail(saved.email);
      if (Number.isInteger(saved.step) && (saved.step ?? 0) >= 0 && (saved.step ?? 0) < steps.length) setIndex(saved.step ?? 0);
    } catch {
      // Keep the blank quiz if stored progress cannot be read.
    }
    ready.current = true;
  }, []);

  useEffect(() => {
    if (step !== 'loader') return;
    const timer = window.setTimeout(() => setIndex(current => current + 1), 3200);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    const id = sessionStorage.getItem(CHECKOUT_KEY);
    if (!id) return;
    void fetch(`/api/style-quiz/${id}`).then(async response => {
      if (!response.ok) return;
      setCheckout(await response.json());
    });
  }, []);

  useEffect(() => {
    if (step !== 'paywall' || !checkout || checkout.paymentStatus === 'paid') return;
    if (checkout.simulate && !checkout.qrImage && checkout.urls.length === 0) return;
    const id = checkout.id;
    const timer = window.setInterval(() => { void refreshCheckout(id); }, 4000);
    return () => window.clearInterval(timer);
  }, [step, checkout?.id, checkout?.paymentStatus, checkout?.simulate, checkout?.qrImage, checkout?.urls.length]);

  const progress = Math.min(100, Math.round((index / (steps.length - 1)) * 100));
  const currentInsight = answers[step]?.insight;
  const feelLabel = answers.feel?.label || 'өөртөө итгэлтэй, үзэсгэлэнтэй';

  const result = useMemo(() => {
    const undertone = String(answers.undertone?.value || 'neutral');
    const season = undertone === 'warm' ? 'Дулаан Намар' : undertone === 'cool' ? 'Зөөлөн Зун' : 'Цэвэр Хавар';
    const palette = undertone === 'warm'
      ? ['#7A3F32', '#C4956A', '#B77848', '#6F7651', '#E7C8A5']
      : undertone === 'cool'
        ? ['#7A2340', '#697D9A', '#A887A4', '#455668', '#D7C6D4']
        : ['#7A2340', '#C4956A', '#567A74', '#D99A9A', '#EBD7BC'];
    return { season, palette };
  }, [answers]);
  const personalizedInsights = useMemo(
    () => Array.from(new Set(Object.values(answers).map(answer => answer.insight).filter(Boolean))).slice(-4),
    [answers],
  );

  function next() {
    setMultiDraft([]);
    setIndex(value => Math.min(steps.length - 1, value + 1));
  }

  function back() {
    setMultiDraft([]);
    setIndex(value => Math.max(0, value - 1));
  }

  function save(key: string, answer: Answer, auto = true) {
    setAnswers(current => ({ ...current, [key]: answer }));
    if (auto) window.setTimeout(next, 220);
  }

  function selectOption(option: Option, multi = false) {
    if (!multi) {
      save(step, { value: option.value, label: option.label, insight: option.insight });
      return;
    }
    setMultiDraft(current => current.includes(option.value) ? current.filter(value => value !== option.value) : [...current, option.value]);
  }

  function saveMulti(questionStep: Step) {
    const question = basicQuestions[questionStep];
    if (!question || !multiDraft.length) return;
    const chosen = question.options.filter(option => multiDraft.includes(option.value));
    save(questionStep, {
      value: multiDraft,
      label: chosen.map(option => option.label).join(', '),
      insight: chosen.map(option => option.insight).join(' '),
    });
  }

  async function refreshCheckout(id: string) {
    const response = await fetch(`/api/style-quiz/${id}/confirm`, { method: 'POST' });
    const data = await response.json();
    const nextCheckout = data.quiz ?? (data.id ? data : null);
    if (response.ok && nextCheckout?.id) setCheckout(nextCheckout);
  }

  async function startPay() {
    setPaying(true);
    setPayError('');
    try {
      const response = await fetch('/api/style-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, answers }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPayError('Төлбөр үүсгэж чадсангүй. Дахин оролдоно уу.');
        return;
      }
      sessionStorage.setItem(CHECKOUT_KEY, data.id);
      setCheckout(data);
    } catch {
      setPayError('Төлбөр үүсгэж чадсангүй. Дахин оролдоно уу.');
    } finally {
      setPaying(false);
    }
  }

  async function simulatePay() {
    if (!checkout) return;
    const response = await fetch(`/api/style-quiz/${checkout.id}/simulate`, { method: 'POST' });
    const data = await response.json();
    if (response.ok && data.quiz) setCheckout(data.quiz);
  }

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    const payload = { name, email, answers: { ...answers, photo: { value: photoName, label: photoName, insight: '' } } };
    save('email', { value: email, label: email, insight: 'Таны хувийн зөвлөмж энэ хаягаар хадгалагдана.' }, false);
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // The preview has no API server; the lead remains safely persisted locally.
    } finally {
      setSending(false);
      next();
    }
  }

  function renderBasic(questionStep: Step) {
    const question = basicQuestions[questionStep]!;
    return (
      <Screen eyebrow={question.eyebrow} title={question.title} subtitle={question.subtitle}>
        <OptionGrid options={question.options} selected={question.multi ? multiDraft : [String(answers[questionStep]?.value || '')]} onSelect={option => selectOption(option, question.multi)} multi={question.multi} />
        {question.multi && <div className="mt-6"><PrimaryButton onClick={() => saveMulti(questionStep)} disabled={!multiDraft.length}>Үргэлжлүүлэх</PrimaryButton></div>}
      </Screen>
    );
  }

  function renderStep() {
    if (basicQuestions[step]) return renderBasic(step);

    if (step === 'age') {
      const options = ['18–25', '26–35', '36–55', '55+'].map((label, i) => ({
        value: label, label, image: photos.ages[i],
        insight: `${label} насны амьдралын хэмнэлд тохирсон, удаан хэрэглэх стайлын зөвлөмж өгнө.`,
      }));
      return <Screen eyebrow="Тантай танилцъя" title="Та аль насны бүлэгт багтах вэ?" subtitle="Зөвлөмжийг таны амьдралын үе шатанд тохируулна."><OptionGrid options={options} selected={[]} onSelect={selectOption} visual twoColumns /></Screen>;
    }
    if (step === 'proof') return (
      <Screen eyebrow="Та зөв газартаа ирлээ" title="Өөрийн өнгө, стайлаа олсон 500+ эмэгтэйн нэг болоорой">
        <div className="grid grid-cols-3 gap-2">
          {photos.customers.map((photo, i) => <img key={photo} src={photo} alt={`Naruka үйлчлүүлэгч ${i + 1}`} className={`h-48 w-full rounded-2xl object-cover ${i === 1 ? 'mt-5' : ''}`} />)}
        </div>
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <div><p className="text-xl font-bold text-charcoal">4.9 <span className="text-gold">★★★★★</span></p><p className="text-xs text-muted">Trustpilot · 327 үнэлгээ</p></div>
          <p className="text-right text-sm font-medium text-charcoal-soft">“Өглөө бүр илүү<br />итгэлтэй болсон.”</p>
        </div>
        <div className="mt-6"><PrimaryButton onClick={next}>Надад ч бас хэрэгтэй</PrimaryButton></div>
      </Screen>
    );
    if (step === 'feelEcho') return (
      <Screen eyebrow="Сайхан зорилго байна" title="Таны хувцас танд яг ийм мэдрэмж өгөх боломжтой">
        <div className="grid grid-cols-[7rem_1fr] gap-4 rounded-3xl bg-white p-4 shadow-sm">
          <img src={photos.testimonial} alt="Naruka үйлчлүүлэгч" className="h-36 w-full rounded-2xl object-cover" />
          <div className="flex flex-col justify-center"><p className="font-[family-name:var(--font-display)] text-xl text-bordeaux">“{feelLabel}”</p><p className="mt-3 text-sm leading-relaxed text-charcoal-soft">“Өнгөө мэдсэнээс хойш би хувцасныхаа цаана нуугдахаа больсон.”</p><p className="mt-2 text-xs font-semibold text-muted">— Саруул, 34</p></div>
        </div>
        <div className="mt-6"><PrimaryButton onClick={next}>Үргэлжлүүлэх</PrimaryButton></div>
      </Screen>
    );
    if (step === 'beforeAfter') return (
      <Screen eyebrow="Жижиг өөрчлөлт, том нөлөө" title="Зөв өнгө таныг илүү амарсан, гэрэлтсэн харагдуулна">
        <div className="grid grid-cols-2 gap-3">
          {[['Өмнө', photos.before], ['Дараа', photos.after]].map(([label, image]) => <div key={label} className="relative overflow-hidden rounded-3xl"><img src={image} alt={label} className="h-72 w-full object-cover" /><span className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold ${label === 'Дараа' ? 'bg-bordeaux text-white' : 'bg-white/90 text-charcoal'}`}>{label}</span></div>)}
        </div>
        <p className="mt-5 text-center text-sm text-muted">Шинэ хүн болох биш — өөрийгөө илүү тод харуулах тухай.</p>
        <div className="mt-6"><PrimaryButton onClick={next}>Миний өнгийг олох</PrimaryButton></div>
      </Screen>
    );
    if (step === 'wardrobeSlider') return (
      <Screen eyebrow="Таны шүүгээ" title="Та хувцасныхаа хэдэн хувийг тогтмол өмсдөг вэ?">
        <div className="rounded-3xl bg-white p-6">
          <p className="text-center font-[family-name:var(--font-display)] text-5xl text-bordeaux">{slider}%</p>
          <input aria-label="Өмсдөг хувцасны хувь" type="range" min="0" max="100" value={slider} onChange={event => setSlider(Number(event.target.value))} className="mt-8 w-full accent-[#7A2340]" />
          <div className="mt-2 flex justify-between text-xs text-muted"><span>0%</span><span>100%</span></div>
          <p className="mt-6 rounded-2xl bg-cream-dark p-4 text-sm leading-relaxed text-charcoal-soft">Таны өмсдөггүй хэсгээс ердөө 10% сэргээхэд л хэдэн арван шинэ хослол бий болно.</p>
        </div>
        <div className="mt-6"><PrimaryButton onClick={() => save('wardrobeSlider', { value: slider, label: `${slider}%`, insight: `Шүүгээний тань ${slider}%-ийг идэвхтэй ашигладаг тул үлдсэн хэсгийг шинэ хослолд оруулах боломжтой.` })}>Үргэлжлүүлэх</PrimaryButton></div>
      </Screen>
    );
    if (step === 'relate') {
      const options: Option[] = [
        { value: 'not', label: 'Огт үгүй', insight: 'Та сонголтдоо харьцангуй тайван бөгөөд нарийвчлал нэмэхэд бэлэн байна.' },
        { value: 'maybe', label: 'Заримдаа', insight: 'Тодорхой хэдэн дүрэм таны эргэлзээг хурдан багасгана.' },
        { value: 'totally', label: 'Яг би', insight: 'Танд дарамт биш, хялбар шийдвэр өгдөг хувийн систем хамгийн хэрэгтэй.' },
      ];
      return <Screen eyebrow="Танд танил санагдаж байна уу?" title="Эдгээр бодлын аль нэг танд төрдөг үү?"><div className="relative mx-auto mb-8 flex aspect-square max-w-sm items-center justify-center rounded-full border border-gold/40 bg-white"><p className="max-w-48 text-center font-[family-name:var(--font-display)] text-xl text-bordeaux">“Олон хувцастай ч өмсөх зүйл олддоггүй.”</p><span className="absolute -left-3 top-12 max-w-36 rotate-[-5deg] rounded-2xl bg-cream-dark p-3 text-xs text-charcoal-soft">“Өнгө зохиж байна уу?”</span><span className="absolute -right-3 bottom-12 max-w-36 rotate-3 rounded-2xl bg-blush p-3 text-xs text-charcoal-soft">“Аваад л, өмсөхгүй юм...”</span></div><OptionGrid options={options} selected={[]} onSelect={selectOption} /></Screen>;
    }
    if (step === 'climate') {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = zone.includes('Ulaanbaatar') ? 'Улаанбаатар' : zone.split('/').pop()?.replace('_', ' ') || 'Улаанбаатар';
      return <Screen eyebrow="Орчин тань стайлд нөлөөлнө" title="Таны байршлын онцлогийг тооцлоо"><div className="overflow-hidden rounded-3xl bg-bordeaux p-7 text-white"><p className="text-xs uppercase tracking-widest text-gold-light">Автоматаар илрүүлсэн</p><p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{city}</p><div className="mt-7 grid grid-cols-3 divide-x divide-white/20 text-center"><div><p className="text-2xl">−8°</p><p className="text-xs text-white/60">Температур</p></div><div><p className="text-2xl">42%</p><p className="text-xs text-white/60">Чийгшил</p></div><div><p className="text-2xl">4 улирал</p><p className="text-xs text-white/60">Capsule</p></div></div></div><p className="mt-5 text-sm leading-relaxed text-muted">Давхарлан өмсөх, дулаан материал, улирал дамнах өнгийг зөвлөмжид тань тусгана.</p><div className="mt-6"><PrimaryButton onClick={() => save('climate', { value: city, label: city, insight: `${city}-ын уур амьсгалд тохирсон давхарлалт, улирал дамнах палитр санал болгоно.` })}>Зөв байна</PrimaryButton></div></Screen>;
    }
    if (step === 'measurements') return (
      <Screen eyebrow="Пропорцын зураглал" title="Таны өндөр, жин хэд вэ?" subtitle="Энэ мэдээлэл зөвхөн силуэт, хувцасны пропорц тооцоход ашиглагдана.">
        <div className="mb-5 flex rounded-full bg-cream-dark p-1">{(['metric', 'imperial'] as const).map(value => <button key={value} onClick={() => setUnit(value)} className={`flex-1 rounded-full py-2 text-sm font-medium ${unit === value ? 'bg-white text-bordeaux shadow-sm' : 'text-muted'}`}>{value === 'metric' ? 'см / кг' : 'ft / lb'}</button>)}</div>
        <div className="grid grid-cols-2 gap-4"><label className="text-sm text-muted">Өндөр<input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder={unit === 'metric' ? '165 см' : '5.5 ft'} className="mt-2 w-full rounded-2xl border border-[#E8DDD5] bg-white p-4 text-charcoal outline-none focus:border-bordeaux" /></label><label className="text-sm text-muted">Жин<input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={unit === 'metric' ? '60 кг' : '132 lb'} className="mt-2 w-full rounded-2xl border border-[#E8DDD5] bg-white p-4 text-charcoal outline-none focus:border-bordeaux" /></label></div>
        <div className="mt-6"><PrimaryButton disabled={!height || !weight} onClick={() => save('measurements', { value: `${height}/${weight}/${unit}`, label: `${height} ${unit === 'metric' ? 'см' : 'ft'}, ${weight} ${unit === 'metric' ? 'кг' : 'lb'}`, insight: 'Таны хэмжээнээс илүү пропорц чухал — зөв урт, шугамыг санал болгоно.' })}>Үргэлжлүүлэх</PrimaryButton></div>
      </Screen>
    );
    if (step === 'comfort') {
      const areas = ['Гар, мөр', 'Гэдэс, бэлхүүс', 'Хөл, ташаа'];
      return <Screen eyebrow="Тав тух хамгийн чухал" title="Эдгээр хэсэгтээ ямар мэдрэмжтэй байдаг вэ?"><div className="space-y-3">{areas.map(area => <div key={area} className="flex items-center justify-between rounded-2xl bg-white p-4"><span className="text-sm font-medium text-charcoal-soft">{area}</span><div className="flex gap-2">{['🙈', '😐', '😊'].map((emoji, i) => <button key={emoji} onClick={() => setAnswers(current => ({ ...current, [`comfort-${area}`]: { value: i, label: `${area}: ${emoji}`, insight: `${area} хэсэгт тухтай, тэнцвэртэй силуэт сонгоно.` } }))} className={`flex size-10 items-center justify-center rounded-full text-xl ${answers[`comfort-${area}`]?.value === i ? 'bg-blush ring-2 ring-bordeaux' : 'bg-cream-dark'}`}>{emoji}</button>)}</div></div>)}</div><p className="mt-5 text-center text-sm text-muted">Таны биеийг “засах” зүйл байхгүй. Бид зөвхөн тав тух, тэнцвэрийг дэмжинэ.</p><div className="mt-6"><PrimaryButton onClick={next}>Үргэлжлүүлэх</PrimaryButton></div></Screen>;
    }
    if (step === 'demo') return <Screen eyebrow="Таны хувийн гарын авлага" title="Эргэлзэх биш, хараад л мэддэг болно"><div className="relative overflow-hidden rounded-3xl"><img src={photos.demo} alt="Naruka хувийн өнгөний палитр" className="h-64 w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/90 to-transparent p-6 pt-20 text-white"><p className="font-[family-name:var(--font-display)] text-2xl">Таны palette · outfit · beauty</p><p className="mt-1 text-sm text-white/70">Нэг дор, утаснаасаа үргэлж харна.</p></div></div><div className="mt-6"><PrimaryButton onClick={next}>Минийхийг бүтээх</PrimaryButton></div></Screen>;
    if (step === 'eye' || step === 'hair' || step === 'skin') {
      const title = step === 'eye' ? 'Таны нүдний өнгө аль нь вэ?' : step === 'hair' ? 'Таны төрөлх үсний өнгө аль нь вэ?' : 'Таны арьсны өнгөтэй хамгийн ойр нь аль вэ?';
      return <Screen eyebrow="Өнгөний шинжилгээ" title={title}><OptionGrid options={swatches[step]} selected={[String(answers[step]?.value || '')]} onSelect={option => save(step, { value: option.value, label: option.label, insight: option.insight }, false)} visual />{currentInsight && <ExpertInsight text={currentInsight} />}{answers[step] && <div className="mt-5"><PrimaryButton onClick={next}>Үргэлжлүүлэх</PrimaryButton></div>}</Screen>;
    }
    if (step === 'hairLength') {
      const options = [
        { value: 'short', label: 'Богино', insight: 'Богино үс нүүр орчмын өнгийг илүү тод харагдуулдаг.' },
        { value: 'shoulder', label: 'Мөр хүрсэн', insight: 'Мөр хүрсэн уртад neckline, ээмгийн харьцаа чухал.' },
        { value: 'long', label: 'Урт', insight: 'Урт үс хувцасны дээд хэсгийн контрасттай хамт ажилладаг.' },
      ];
      return <Screen eyebrow="Өнгөний шинжилгээ" title="Таны үсний урт?"><OptionGrid options={options} selected={[String(answers.hairLength?.value || '')]} onSelect={option => save('hairLength', { value: option.value, label: option.label, insight: option.insight }, false)} />{currentInsight && <ExpertInsight text={currentInsight} />}{answers.hairLength && <div className="mt-5"><PrimaryButton onClick={next}>Үргэлжлүүлэх</PrimaryButton></div>}</Screen>;
    }
    if (step === 'undertone') {
      const options = [
        { value: 'warm', label: 'Дулаан · алт, peach', insight: 'Дулаан undertone-г зэс, cream, terracotta өнгө байгалийн гэрэлтэй харагдуулна.' },
        { value: 'neutral', label: 'Neutral · аль аль нь', insight: 'Neutral undertone олон өнгийг даах тул гүн, ханалтыг нарийн тааруулна.' },
        { value: 'cool', label: 'Хүйтэн · мөнгө, rose', insight: 'Хүйтэн undertone-г berry, blue, soft white өнгө тунгалаг харагдуулна.' },
      ];
      return <Screen eyebrow="Арьсны доод өнгө" title="Алт эсвэл мөнгө — аль нь таныг илүү гэрэлтүүлдэг вэ?"><OptionGrid options={options} selected={[String(answers.undertone?.value || '')]} onSelect={option => save('undertone', { value: option.value, label: option.label, insight: option.insight }, false)} />{currentInsight && <ExpertInsight text={currentInsight} />}{answers.undertone && <div className="mt-5"><PrimaryButton onClick={next}>Үргэлжлүүлэх</PrimaryButton></div>}</Screen>;
    }
    if (step === 'bodyShape') {
      const options = [
        ['hourglass', 'Элсэн цаг', '◇'], ['pear', 'Лийр', '▽'], ['apple', 'Алим', '○'], ['rectangle', 'Тэгш өнцөгт', '▯'], ['triangle', 'Урвуу гурвалжин', '△'],
      ].map(([value, label, emoji]) => ({ value, label, emoji, insight: `${label} пропорцыг “засах” биш, таны дуртай хэсгийг тодруулах шугам сонгоно.` }));
      return <Screen eyebrow="Силуэт" title="Таны биеийн пропорц аль дүрстэй ойр вэ?"><OptionGrid options={options} selected={[String(answers.bodyShape?.value || '')]} onSelect={option => save('bodyShape', { value: option.value, label: option.label, insight: option.insight }, false)} visual />{currentInsight && <ExpertInsight text={currentInsight} />}{answers.bodyShape && <div className="mt-5"><PrimaryButton onClick={next}>Үргэлжлүүлэх</PrimaryButton></div>}</Screen>;
    }
    if (step === 'colors') {
      const options = [
        ['black', 'Хар', '#1E1A18'], ['white', 'Цагаан', '#F5F1E9'], ['red', 'Улаан', '#9A3044'], ['pink', 'Ягаан', '#D9A3AD'],
        ['blue', 'Цэнхэр', '#526F92'], ['green', 'Ногоон', '#5F765E'], ['beige', 'Beige', '#CDB99F'], ['brown', 'Хүрэн', '#76513F'],
        ['purple', 'Нил ягаан', '#715775'], ['yellow', 'Шар', '#D5AA55'], ['orange', 'Улбар', '#C8784F'], ['grey', 'Саарал', '#898681'],
      ].map(([value, label, color]) => ({ value, label, color, insight: `${label} өнгийг таны палитрт хамгийн зохимжтой хувилбараар оруулна.` }));
      return <Screen eyebrow="Таны өнгөний баяр баясал" title="Та ямар өнгөнд хамгийн их дуртай вэ?" subtitle="Дуртай бүх өнгөө сонгоорой."><OptionGrid options={options} selected={multiDraft} onSelect={option => setMultiDraft(current => current.includes(option.value) ? current.filter(v => v !== option.value) : [...current, option.value])} multi visual /><div className="mt-6"><PrimaryButton disabled={!multiDraft.length} onClick={() => { const chosen = options.filter(o => multiDraft.includes(o.value)); save('colors', { value: multiDraft, label: chosen.map(o => o.label).join(', '), insight: 'Таны дуртай өнгийг хориглохгүй — хамгийн гэрэлтсэн хувилбарыг нь олно.' }); }}>Үргэлжлүүлэх</PrimaryButton></div></Screen>;
    }
    if (step === 'outfits') {
      const outfit = outfitOptions[outfitIndex];
      return <Screen eyebrow={`Төрх ${outfitIndex + 1} / ${outfitOptions.length}`} title="Та үүнийг өмсөх үү?"><div className="mx-auto max-w-sm overflow-hidden rounded-3xl bg-white shadow-lg"><img src={outfit.image} alt={`${outfit.label} төрх`} className="h-96 w-full object-cover" /><p className="p-4 text-center font-[family-name:var(--font-display)] text-xl text-charcoal">{outfit.label}</p></div><div className="mt-6 grid grid-cols-3 gap-3">{[['never', 'Үгүй'], ['maybe', 'Магадгүй'], ['love', 'Тэгэлгүй яах вэ']].map(([value, label]) => <button key={value} onClick={() => { const updated = { ...outfitRatings, [outfit.value]: value }; setOutfitRatings(updated); if (outfitIndex < outfitOptions.length - 1) setOutfitIndex(i => i + 1); else save('outfits', { value: Object.values(updated), label: JSON.stringify(updated), insight: outfitOptions.map(o => o.insight).join(' ') }); }} className="rounded-2xl border border-[#E8DDD5] bg-white px-2 py-4 text-sm font-medium text-charcoal-soft hover:border-bordeaux hover:text-bordeaux">{label}</button>)}</div></Screen>;
    }
    if (step === 'reviews') return <Screen eyebrow="500+ бодит өөрчлөлт" title="Таны өмнө яг адил эргэлзэж байсан хүмүүс"><div className="flex snap-x gap-4 overflow-x-auto pb-4">{[
      ['“Өглөө 20 минут хэмнэдэг болсон.”', 'Номин, 29'],
      ['“Тохироогүй худалдан авалт бараг зогссон.”', 'Оюунаа, 37'],
      ['“Өөрийн өнгөө зүүхэд хүмүүс байнга магтдаг.”', 'Солонго, 32'],
      ['“Шүүгээ цөөн ч, хослол илүү олон болсон.”', 'Энхээ, 41'],
    ].map(([quote, person]) => <div key={person} className="min-w-[78%] snap-center rounded-3xl bg-white p-6 shadow-sm"><p className="text-gold">★★★★★</p><p className="mt-4 font-[family-name:var(--font-display)] text-xl leading-snug text-charcoal">{quote}</p><p className="mt-5 text-xs font-semibold text-muted">{person}</p></div>)}</div><div className="mt-5"><PrimaryButton onClick={next}>Үргэлжлүүлэх</PrimaryButton></div></Screen>;
    if (step === 'unlock') return <Screen eyebrow="Таны зураглал бэлэн" title="Үр дүнгээ нээх цаг боллоо"><div className="rounded-3xl bg-bordeaux p-7 text-white"><div className="grid grid-cols-3 gap-3 text-center">{[['✓', 'Өнгө'], ['✓', 'Силуэт'], ['✓', 'Стайл']].map(([icon, label]) => <div key={label} className="rounded-2xl bg-white/10 p-4"><p className="text-2xl text-gold">{icon}</p><p className="mt-2 text-xs">{label}</p></div>)}</div><p className="mt-6 text-center font-[family-name:var(--font-display)] text-2xl">Танд зориулсан 3 хэсэгт тайлан</p></div><div className="mt-6"><PrimaryButton onClick={next}>Үр дүнгээ нээх</PrimaryButton></div></Screen>;
    if (step === 'photo') return <Screen eyebrow="Сонголттой алхам" title="Өнгөний нарийвчлалыг зургаар нэмэгдүүлэх үү?" subtitle="Байгалийн гэрэлд, makeup-гүй нүүрний зураг хамгийн тохиромжтой."><label className="flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed border-gold bg-white p-10 text-center"><span className="flex size-14 items-center justify-center rounded-full bg-blush text-2xl text-bordeaux">＋</span><span className="mt-4 font-semibold text-charcoal">{photoName || 'Зураг сонгох'}</span><span className="mt-1 text-xs text-muted">JPG эсвэл PNG</span><input type="file" accept="image/*" className="hidden" onChange={event => setPhotoName(event.target.files?.[0]?.name || '')} /></label><div className="mt-6"><PrimaryButton onClick={next}>{photoName ? 'Зургийг ашиглах' : 'Дараа оруулах'}</PrimaryButton></div></Screen>;
    if (step === 'great') return <Screen eyebrow="Гайхалтай ажиллалаа" title="Бараг бэлэн боллоо"><div className="mx-auto flex size-32 items-center justify-center rounded-full bg-bordeaux text-5xl text-white shadow-xl shadow-bordeaux/20">✓</div><p className="mx-auto mt-7 max-w-sm text-center leading-relaxed text-charcoal-soft">Таны хариултаас өнгө, пропорц, амьдралын хэв маягийн зураглал үүсгэлээ.</p><div className="mt-8"><PrimaryButton onClick={next}>Сүүлийн алхам</PrimaryButton></div></Screen>;
    if (step === 'email') return <Screen eyebrow="Тайлангаа хадгалаарай" title="Үр дүнг тань хаашаа илгээх вэ?" subtitle="Таны хариултыг зар сурталчилгаанд бус, хувийн тайлан үүсгэхэд ашиглана."><form onSubmit={submitEmail} className="space-y-4"><label className="block text-sm text-muted">Нэр<input required value={name} onChange={e => setName(e.target.value)} placeholder="Таны нэр" className="mt-2 w-full rounded-2xl border border-[#E8DDD5] bg-white p-4 text-charcoal outline-none focus:border-bordeaux" /></label><label className="block text-sm text-muted">И-мэйл<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-[#E8DDD5] bg-white p-4 text-charcoal outline-none focus:border-bordeaux" /></label><PrimaryButton type="submit" disabled={sending}>{sending ? 'Хадгалж байна…' : 'Миний үр дүнг үүсгэх'}</PrimaryButton></form></Screen>;
    if (step === 'loader') return <Screen eyebrow="Таны мэдээллийг нэгтгэж байна" title="Хувийн стайл зураглал үүсгэж байна…"><div className="mx-auto my-8 size-24 animate-spin rounded-full border-4 border-cream-dark border-t-bordeaux" /><div className="space-y-3">{['Өнгөний контраст тооцсон', 'Силуэтийн зөвлөмж бэлэн', 'Хувийн палитр үүсгэж байна'].map((label, i) => <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm text-charcoal-soft"><span className={`flex size-6 items-center justify-center rounded-full ${i < 2 ? 'bg-bordeaux text-white' : 'animate-pulse bg-gold/30 text-bordeaux'}`}>{i < 2 ? '✓' : '·'}</span>{label}</div>)}</div></Screen>;
    if (step === 'results') return <Screen eyebrow={`${name || 'Таны'} хувийн үр дүн`} title={`Таны өнгөний улирал — ${result.season}`}><div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-xs uppercase tracking-widest text-muted">Таны palette</p><div className="mt-4 flex gap-2">{result.palette.map(color => <span key={color} className="h-16 flex-1 rounded-xl" style={{ backgroundColor: color }} />)}</div><div className="mt-6 border-t border-[#E8DDD5] pt-5"><p className="font-semibold text-charcoal">Танд зориулсан гол санаанууд</p><div className="mt-3 space-y-3">{personalizedInsights.map(insight => <p key={insight} className="flex gap-3 text-sm leading-relaxed text-charcoal-soft"><span className="text-gold">✦</span>{insight}</p>)}</div></div></div><div className="relative mt-5 overflow-hidden rounded-3xl bg-white p-6"><div className="blur-[5px]"><p className="font-[family-name:var(--font-display)] text-2xl text-bordeaux">Таны 12 outfit томьёо</p><p className="mt-3 text-sm text-charcoal-soft">Ажил, уулзалт, амралт, онцгой өдөр бүрт...</p><div className="mt-4 grid grid-cols-3 gap-3">{result.palette.slice(0, 3).map(color => <div key={color} className="h-24 rounded-xl" style={{ backgroundColor: color }} />)}</div></div><span className="absolute inset-0 flex items-center justify-center font-semibold text-bordeaux">Бүрэн тайланд нээнэ</span></div><div className="mt-6"><PrimaryButton onClick={next}>Бүрэн тайлангаа авах</PrimaryButton></div></Screen>;
    if (step === 'paywall') {
      if (checkout?.paymentStatus === 'paid') {
        return (
          <Screen eyebrow="Төлбөр амжилттай" title="Амжилттай">
            <div className="mx-auto flex size-32 items-center justify-center rounded-full bg-bordeaux text-5xl text-white shadow-xl shadow-bordeaux/20">✓</div>
            <p className="mx-auto mt-7 max-w-md text-center leading-relaxed text-charcoal-soft">
              Таны тайлан 30–45 минутын дараа бэлэн болж, <span className="font-semibold text-charcoal">{checkout.email || email}</span> хаяг руу очно.
            </p>
            <p className="mt-4 text-center text-sm text-muted">Хиймэл оюун ухаан таны хариултыг шинжилж, хувийн стайл тайланг имэйлээр илгээнэ.</p>
          </Screen>
        );
      }
      return (
        <Screen eyebrow="Хувийн тайлан" title="Стайлын гарын авлагаа нээгээрэй" subtitle="Төлбөр баталгаажмагц хариултыг хиймэл оюун ухаанаар шинжилж, тайланг таны имэйл рүү илгээнэ.">
          <div className="rounded-3xl border border-bordeaux bg-blush p-5 ring-2 ring-bordeaux/10">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-charcoal">Хувийн стайл тайлан</p>
              <p className="font-[family-name:var(--font-display)] text-3xl text-bordeaux">150₮</p>
            </div>
            <p className="mt-2 text-sm text-muted">Өнгө, силуэт, өдөр тутмын хослол, худалдан авалтын зөвлөгөө. {email}</p>
          </div>
          {checkout ? (
            <div className="mt-5 space-y-4">
              {checkout.qrImage ? <img src={checkout.qrImage} alt="QPay QR" className="mx-auto w-56 rounded-2xl bg-white p-3" /> : null}
              {checkout.urls.length ? (
                <ul className="grid gap-2">
                  {checkout.urls.map(url => (
                    <li key={url.link}>
                      <a href={url.link} className="flex items-center gap-3 rounded-2xl border border-[#E8DDD5] bg-white px-4 py-3 text-sm font-semibold text-charcoal">
                        {url.logo ? <img src={url.logo} alt="" className="size-8 rounded-lg object-contain" /> : null}
                        {url.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              <PrimaryButton onClick={() => void refreshCheckout(checkout.id)}>Төлбөр шалгах</PrimaryButton>
              {checkout.simulate ? <button type="button" onClick={() => void simulatePay()} className="w-full rounded-full border border-bordeaux px-6 py-3 text-sm font-semibold text-bordeaux">Туршилтын төлбөр баталгаажуулах</button> : null}
            </div>
          ) : (
            <div className="mt-6"><PrimaryButton onClick={() => void startPay()} disabled={paying}>{paying ? 'Нэхэмжлэл үүсгэж байна…' : '150₮ төлөөд тайлан авах'}</PrimaryButton></div>
          )}
          {payError ? <p className="mt-4 text-center text-sm text-bordeaux">{payError}</p> : null}
        </Screen>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-cream">
      <div className="pointer-events-none fixed -left-32 top-24 size-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 bottom-10 size-96 rounded-full bg-bordeaux/10 blur-3xl" />
      <header className="sticky top-0 z-20 border-b border-[#E8DDD5] bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <button onClick={close} aria-label="Тест хаах" className="flex size-10 items-center justify-center rounded-full border border-transparent text-xl text-charcoal-soft transition hover:border-[#E8DDD5] hover:bg-white">×</button>
          <img src="/naruka-logo.png" alt="Naruka Styling Studio" className="h-9 w-auto object-contain brightness-0" />
          <button onClick={back} disabled={index === 0 || step === 'loader'} className="rounded-full px-3 py-2 text-sm font-semibold text-bordeaux transition hover:bg-blush disabled:invisible">Буцах</button>
        </div>
        <div className="relative h-1 bg-cream-dark"><div className="h-full rounded-r-full bg-gradient-to-r from-gold to-bordeaux transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      </header>
      <main className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-3xl px-4 py-6 sm:px-5 sm:py-12">
        <div className="mb-3 flex items-center justify-end px-2 text-xs font-medium text-muted">
          <span>{index + 1} / {steps.length}</span>
        </div>
        <div key={step} className="animate-[fadeIn_.35s_ease-out]">{renderStep()}</div>
      </main>
    </div>
  );
}

function Screen({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/55 p-4 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-8">
      <div className="mb-7 text-center sm:mb-9">
        <p className="mx-auto mb-4 w-fit rounded-full bg-blush px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-bordeaux">{eyebrow}</p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.12] text-charcoal sm:text-4xl">{title}</h2>
        {subtitle && <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
