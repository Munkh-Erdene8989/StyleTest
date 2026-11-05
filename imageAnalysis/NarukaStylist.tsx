import {
  ChangeEvent,
  DragEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

export type Archetype = "Gamine" | "Romantic" | "Natural" | "Dramatic"

export type BodyShape = "hourglass" | "pear" | "apple" | "rectangle" | "inverted-triangle" | "diamond"

export type StylistPreferences = {
  occasions: string[]
  priorities: string[]
  notes: string
  bodyShape: BodyShape | ""
}

export type AnalyzeInput = {
  file: File
  preferences: StylistPreferences
}

export type Outfit = {
  id: string
  title: string
  context: string
  formula: string
  image: string
}

export type AnalysisResult = {
  archetype: Archetype
  match: number
  kicker: string
  headline: string
  summary: string
  traits: string[]
  palette: { name: string hex: string }[]
  silhouettes: string[]
  fabrics: string[]
  details: string[]
  avoid: string[]
  outfits: Outfit[]
}

export type NarukaStylistProps = {
  onAnalyze?: (input: AnalyzeInput) => Promise<AnalysisResult> | AnalysisResult
  className?: string
}

const PHOTOS = [
  "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1692180142575-c31fcd106b5b?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1618333452884-5c8d211ed2ad?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1584216338898-f34d78201414?auto=format&fit=crop&w=900&q=82",
]

const FACE_GUIDE_PHOTO =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=88"

const MOCK_RESULTS: Record<Archetype, AnalysisResult> = {
  Gamine: {
    archetype: "Gamine",
    match: 86,
    kicker: "Playful precision",
    headline: "Цэгцтэй хэрнээ\nгэнэтийн хэмнэл",
    summary:
      "Таны төрхөд богино, тод шугам болон хөгжилтэй контраст хамгийн амьд харагдана. Сонгодог суурийг нэг сонирхолтой детальтай хослуулахад таны дүр төрх илүү итгэлтэй, орчин үеийн болдог.",
    traits: ["Цэгцтэй", "Эрч хүчтэй", "Контрасттай"],
    palette: [
      { name: "Ink", hex: "#1D2525" },
      { name: "Chalk", hex: "#F1EEE5" },
      { name: "Tomato", hex: "#D94B3D" },
      { name: "Cobalt", hex: "#315B8A" },
      { name: "Moss", hex: "#64715B" },
    ],
    silhouettes: [
      "Богино жакет + өндөр суудалтай өмд",
      "Тэгш захтай мини даашинз",
      "Шулуун жийнс + жижиг хэмжээст цамц",
    ],
    fabrics: ["Нягт хөвөн", "Гөлгөр ноос", "Хэлбэрээ барьдаг деним"],
    details: ["График судал", "Жижиг металл товч", "Өнгийн оймс эсвэл цүнх"],
    avoid: [
      "Хэт урт, сул давхарга",
      "Толгойноос хөл хүртэл нэгэн хэвийн пастель",
    ],
    outfits: [
      {
        id: "g-1",
        title: "Хотын хэмнэл",
        context: "Өдөр тутам",
        formula: "Богино тренч • цагаан футболк • шулуун өмд",
        image: PHOTOS[0],
      },
      {
        id: "g-2",
        title: "Галерейн орой",
        context: "Уулзалт",
        formula: "График жакет • мини юбка • лофер",
        image: PHOTOS[1],
      },
      {
        id: "g-3",
        title: "Зөөлөн контраст",
        context: "Амралтын өдөр",
        formula: "Кардиган • хар деним • тод жижиг цүнх",
        image: PHOTOS[2],
      },
    ],
  },
  Romantic: {
    archetype: "Romantic",
    match: 89,
    kicker: "Soft expression",
    headline: "Зөөлөн дүрс,\nмэдрэмжтэй деталь",
    summary:
      "Таны дүр төрх зөөлөн муруй шугам, бие дагасан боловч хэт бариу биш эсгүүртэй хамгийн зохицно. Гялбаа, торго, нарийн хээ зэрэг жижиг мэдрэмжүүд төрхийг тань баяжуулна.",
    traits: ["Зөөлөн", "Нарийн", "Мэдрэмжтэй"],
    palette: [
      { name: "Rosewood", hex: "#7F4E50" },
      { name: "Blush", hex: "#E8CBC4" },
      { name: "Cream", hex: "#F4ECE0" },
      { name: "Plum", hex: "#55404F" },
      { name: "Sage", hex: "#899485" },
    ],
    silhouettes: [
      "Бэлхүүс тодруулсан миди даашинз",
      "Зөөлөн мөртэй цамц + урсгал юбка",
      "Бүсэлхийтэй пальто",
    ],
    fabrics: ["Торго", "Нарийн сүлжмэл", "Зөөлөн хилэн"],
    details: ["Сувдан акцент", "Дугуй зах", "Нарийн цэцгэн хээ"],
    avoid: ["Хэт дөрвөлжин, хүнд мөр", "Овор ихтэй спорт деталь"],
    outfits: [
      {
        id: "r-1",
        title: "Өглөөний гэрэл",
        context: "Өдөр тутам",
        formula: "Зөөлөн цамц • миди юбка • балетка",
        image: PHOTOS[2],
      },
      {
        id: "r-2",
        title: "Нам гүм орой",
        context: "Онцгой өдөр",
        formula: "Торгон даашинз • богино кардиган • жижиг цүнх",
        image: PHOTOS[3],
      },
      {
        id: "r-3",
        title: "Ухаалаг зөөлөн",
        context: "Ажил",
        formula: "Бүсэлхийтэй жакет • урсгал өмд • нарийн гутал",
        image: PHOTOS[0],
      },
    ],
  },
  Natural: {
    archetype: "Natural",
    match: 91,
    kicker: "Quiet ease",
    headline: "Чөлөөтэй хэлбэр,\nжинхэнэ материал",
    summary:
      "Таны давуу тал бол хүчлэхгүйгээр цэгцтэй харагдах мэдрэмж. Амьсгалдаг материал, бага зэрэг сул эсгүүр, байгалийн өнгөний давхарга таны төрхийг дулаан бөгөөд итгэлтэй болгоно.",
    traits: ["Чөлөөтэй", "Дулаан", "Тэнцвэртэй"],
    palette: [
      { name: "Espresso", hex: "#40372F" },
      { name: "Oat", hex: "#DED1BA" },
      { name: "Clay", hex: "#A7654D" },
      { name: "Olive", hex: "#6D735D" },
      { name: "Sky", hex: "#9DAEB0" },
    ],
    silhouettes: [
      "Сул жакет + шулуун өмд",
      "Урт цамцан даашинз",
      "Өргөн жийнс + бүтэцтэй сүлжмэл",
    ],
    fabrics: ["Маалинга", "Бүдүүн сүлжмэл", "Угаасан деним"],
    details: ["Арьсан бүс", "Гар хийцийн мэт текстур", "Тональ давхарга"],
    avoid: ["Хэт гялалзсан синтетик", "Хөдөлгөөн хязгаарласан бариу эсгүүр"],
    outfits: [
      {
        id: "n-1",
        title: "Тайван хот",
        context: "Өдөр тутам",
        formula: "Маалинган жакет • майк • өргөн өмд",
        image: PHOTOS[0],
      },
      {
        id: "n-2",
        title: "Амралтын хэмнэл",
        context: "Амралтын өдөр",
        formula: "Сүлжмэл цамц • угаасан деним • арьсан цүнх",
        image: PHOTOS[2],
      },
      {
        id: "n-3",
        title: "Дулаан давхарга",
        context: "Ажил",
        formula: "Урт пальто • тональ цамц • шулуун өмд",
        image: PHOTOS[3],
      },
    ],
  },
  Dramatic: {
    archetype: "Dramatic",
    match: 88,
    kicker: "Modern impact",
    headline: "Урт шугам,\nмартагдахгүй дүр",
    summary:
      "Таны төрх тод бүтэц, цэвэр геометр, зоримог хэмжээсийг өөрийн болгодог. Нэг хүчтэй силуэтэд төвлөрч, бусад деталиа хасах нь таныг хамгийн орчин үеийн харагдуулна.",
    traits: ["Тод", "Бүтэцтэй", "Минимал"],
    palette: [
      { name: "Black", hex: "#171717" },
      { name: "Bone", hex: "#E9E5DC" },
      { name: "Oxide", hex: "#8F342D" },
      { name: "Steel", hex: "#68747B" },
      { name: "Electric", hex: "#344F9A" },
    ],
    silhouettes: [
      "Урт шулуун пальто",
      "Өргөн мөртэй жакет + нарийн өмд",
      "Асимметрик макси даашинз",
    ],
    fabrics: ["Нягт ноос", "Гөлгөр арьс", "Хүнд торго"],
    details: ["Том геометр ээмэг", "Хурц хошуутай гутал", "Нэг өнгийн багана"],
    avoid: ["Олон жижиг чимэглэл", "Тодорхойгүй, дунд зэргийн хэлбэр"],
    outfits: [
      {
        id: "d-1",
        title: "Хотын багана",
        context: "Ажил",
        formula: "Урт хар пальто • нэг өнгийн хослол • хурц гутал",
        image: PHOTOS[1],
      },
      {
        id: "d-2",
        title: "Архитектур",
        context: "Онцгой өдөр",
        formula: "Асимметрик даашинз • металл ээмэг • клач",
        image: PHOTOS[3],
      },
      {
        id: "d-3",
        title: "Тод хэмжээс",
        context: "Уулзалт",
        formula: "Өргөн мөртэй жакет • цэвэр майк • нарийн өмд",
        image: PHOTOS[0],
      },
    ],
  },
}

const ARCHETYPES: Archetype[] = ["Gamine", "Romantic", "Natural", "Dramatic"]
const OCCASIONS = ["Өдөр тутам", "Ажил", "Арга хэмжээ", "Аялал"]
const PRIORITIES = ["Тав тух", "Минимал", "Өнгөлөг", "Тренд"]
const BODY_SHAPES: { value: BodyShape label: string hint: string }[] = [
  { value: "hourglass", label: "Элсэн цаг", hint: "Мөр, ташаа тэнцүү" },
  { value: "pear", label: "Лийр", hint: "Ташаа илүү өргөн" },
  { value: "apple", label: "Алим", hint: "Төв хэсэг зөөлөн" },
  { value: "rectangle", label: "Тэгш өнцөгт", hint: "Шугамууд ойролцоо" },
  {
    value: "inverted-triangle",
    label: "Урвуу гурвалжин",
    hint: "Мөр илүү өргөн",
  },
  { value: "diamond", label: "Ромб", hint: "Төв хэсэг өргөн" },
]
const MAX_IMAGE_SIZE = 20 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]

function Icon({
  name,
  size = 18,
}: {
  name: "upload" | "sparkle" | "bookmark" | "print" | "edit" | "reset" | "chevron" | "check" | "close"
  size?: number
}) {
  const paths: Record<string, ReactNode> = {
    upload: (
      <>
        <path d="M12 16V3m0 0L7 8m5-5 5 5" />
        <path d="M5 13v6h14v-6" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
    bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
    print: (
      <>
        <path d="M7 9V3h10v6M7 18H4v-7h16v7h-3" />
        <path d="M7 14h10v7H7z" />
      </>
    ),
    edit: (
      <>
        <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
        <path d="m13.5 7 3.5 3.5" />
      </>
    ),
    reset: (
      <>
        <path d="M4 5v5h5" />
        <path d="M5.5 9A8 8 0 1 1 5 16" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function ChipGroup({
  label,
  values,
  selected,
  onChange,
}: {
  label: string
  values: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <fieldset className="ns-fieldset">
      <legend>{label}</legend>
      <div className="ns-chips">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected.includes(value)}
            onClick={() => onChange(toggleValue(selected, value))}
          >
            {selected.includes(value) && <Icon name="check" size={14} />}
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function BodyShapeFigure({ shape }: { shape: BodyShape }) {
  const bodies: Record<BodyShape, string> = {
    hourglass:
      "M34 34 C29 40 30 52 38 61 C42 67 40 78 32 93 C28 102 34 110 39 114 L61 114 C66 110 72 102 68 93 C60 78 58 67 62 61 C70 52 71 40 66 34 C58 38 42 38 34 34Z",
    pear: "M37 34 C32 42 34 53 39 61 C42 67 36 79 28 94 C23 103 31 111 37 114 L63 114 C69 111 77 103 72 94 C64 79 58 67 61 61 C66 53 68 42 63 34 C56 38 44 38 37 34Z",
    apple:
      "M33 34 C25 40 24 53 29 66 C33 75 34 84 32 94 C30 103 37 111 41 114 L59 114 C63 111 70 103 68 94 C66 84 67 75 71 66 C76 53 75 40 67 34 C59 38 41 38 33 34Z",
    rectangle:
      "M33 34 C31 44 33 55 34 65 L33 94 C32 103 38 111 41 114 L59 114 C62 111 68 103 67 94 L66 65 C67 55 69 44 67 34 C59 38 41 38 33 34Z",
    "inverted-triangle":
      "M27 34 C27 45 35 54 41 62 C45 69 42 81 38 94 C35 103 40 111 43 114 L57 114 C60 111 65 103 62 94 C58 81 55 69 59 62 C65 54 73 45 73 34 C62 38 38 38 27 34Z",
    diamond:
      "M37 34 C31 42 33 53 37 61 C41 69 29 81 27 94 C25 103 35 111 41 114 L59 114 C65 111 75 103 73 94 C71 81 59 69 63 61 C67 53 69 42 63 34 C56 38 44 38 37 34Z",
  }
  const highlights: Record<BodyShape, string> = {
    hourglass:
      "M24 42 C35 34 65 34 76 42 C67 58 66 72 78 99 C68 114 32 114 22 99 C34 72 33 58 24 42Z",
    pear: "M34 41 C43 36 57 36 66 41 L82 105 C68 119 32 119 18 105Z",
    apple:
      "M23 48 C28 34 72 34 77 48 C84 66 80 92 68 104 C59 113 41 113 32 104 C20 92 16 66 23 48Z",
    rectangle: "M25 38 H75 V109 H25Z",
    "inverted-triangle": "M18 39 H82 L65 106 H35Z",
    diamond: "M50 35 82 77 50 116 18 77Z",
  }

  return (
    <svg viewBox="0 0 100 156" aria-hidden="true">
      <path className="ns-shape-zone" d={highlights[shape]} />
      <circle className="ns-model-head" cx="50" cy="16" r="10" />
      <path
        className="ns-model-hair"
        d="M40 16C40 4 60 3 61 16l-3-5-3 4-4-5-5 5-4-4-2 5Z"
      />
      <path className="ns-model-neck" d="M44 25v10m12-10v10" />
      <path
        className="ns-model-limb"
        d="M34 40C26 49 23 67 20 87c-1 8-4 13-7 19m53-66c8 9 11 27 14 47 1 8 4 13 7 19"
      />
      <path className="ns-model-suit" d={bodies[shape]} />
      <path className="ns-model-neckline" d="M40 37c3 8 17 8 20 0" />
      <path
        className="ns-model-limb"
        d="M39 113c-2 12-4 26-6 40m28-40c2 12 4 26 6 40"
      />
      <path className="ns-model-foot" d="m27 153 7-1m39 1-7-1" />
      <circle className="ns-model-hand" cx="12.5" cy="108" r="2.4" />
      <circle className="ns-model-hand" cx="87.5" cy="108" r="2.4" />
    </svg>
  )
}

function CaptureGuide() {
  const [openGuide, setOpenGuide] = useState<"photo" | "video" | null>(null)

  useEffect(() => {
    if (!openGuide) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenGuide(null)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [openGuide])

  return (
    <div className="ns-capture-guide">
      <div className="ns-guide-title">
        <span>ЗӨВ МАТЕРИАЛ БЭЛДЭХ</span>
        <h3>Яаж зураг, бичлэг авах вэ?</h3>
        <p>Камераа нүдний түвшинд, нүүрнээс 40–60 см зайд байрлуулаарай.</p>
      </div>
      <div className="ns-guide-options">
        <div>
          <span className="ns-guide-icon">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <rect x="5" y="8" width="22" height="17" rx="2" />
              <circle cx="16" cy="16.5" r="5" />
              <path d="m10 8 2-3h8l2 3" />
            </svg>
          </span>
          <div>
            <span className="ns-guide-card-title">
              <strong>Зураг авах</strong>
              <button
                type="button"
                className="ns-info-button"
                aria-label="Нүүрний зураг авах дэлгэрэнгүй заавар"
                onClick={() => setOpenGuide("photo")}
              >
                <span className="ns-info-ping" />i
              </button>
            </span>
            <ol>
              <li>Нүүр бүхэлдээ хүрээнд харагдах</li>
              <li>Камер руу цэх, тайван харах</li>
              <li>Нүүрэн дээр жигд гэрэл тусгах</li>
            </ol>
          </div>
        </div>
        <div>
          <span className="ns-guide-icon">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <rect x="4" y="7" width="18" height="18" rx="2" />
              <path d="m22 13 6-3v12l-6-3z" />
              <path d="M9 12h8M9 16h5" />
            </svg>
          </span>
          <div>
            <span className="ns-guide-card-title">
              <strong>Бичлэг хийх</strong>
              <button
                type="button"
                className="ns-info-button"
                aria-label="Нүүрний бичлэг хийх дэлгэрэнгүй заавар"
                onClick={() => setOpenGuide("video")}
              >
                <span className="ns-info-ping" />i
              </button>
            </span>
            <ol>
              <li>5–8 секунд хангалттай</li>
              <li>Толгойгоо зөөлөн хоёр тийш эргүүлэх</li>
              <li>Малгай, нүдний шилгүй байх</li>
            </ol>
          </div>
        </div>
      </div>
      <div className="ns-guide-note">
        <Icon name="check" size={14} />
        Үс нүүрийг халхлаагүй, камерын линз цэвэр эсэхийг шалгаарай.
      </div>
      {openGuide && (
        <div
          className="ns-face-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ns-face-guide-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpenGuide(null)
          }}
        >
          <div className="ns-face-dialog">
            <button
              type="button"
              className="ns-modal-close"
              aria-label="Зааврыг хаах"
              onClick={() => setOpenGuide(null)}
            >
              <Icon name="close" size={18} />
            </button>
            <div className="ns-verification-demo">
              <div className={`ns-phone-frame is-${openGuide}`}>
                <span className="ns-corner top-left" />
                <span className="ns-corner top-right" />
                <span className="ns-corner bottom-left" />
                <span className="ns-corner bottom-right" />
                <img
                  className="ns-face-model"
                  src={FACE_GUIDE_PHOTO}
                  alt="Нүүрээ хүрээнд зөв байрлуулсан жишээ"
                />
                <span className="ns-scan-line" />
                {openGuide === "video" && (
                  <>
                    <span className="ns-turn-arrow left">‹</span>
                    <span className="ns-turn-arrow right">›</span>
                  </>
                )}
                <span className="ns-status-dot" />
                <small>
                  {openGuide === "photo"
                    ? "НҮҮРЭЭ ХҮРЭЭНД БАЙРЛУУЛНА УУ"
                    : "ТОЛГОЙГОО ЗӨӨЛӨН ЭРГҮҮЛНЭ ҮҮ"}
                </small>
              </div>
            </div>
            <div className="ns-modal-copy">
              <span>FACE CAPTURE GUIDE</span>
              <h3 id="ns-face-guide-title">
                {openGuide === "photo"
                  ? "Нүүрний зураг зөв авах"
                  : "Нүүрний бичлэг зөв хийх"}
              </h3>
              <p>
                {openGuide === "photo"
                  ? "Нүүрээ зууван хүрээний төвд байрлуулж, хөдөлгөөнгүйгээр камер руу эгц харна."
                  : "Нүүрээ хүрээнээс гаргалгүй эхлээд төв рүү, дараа нь толгойгоо зүүн ба баруун тийш аажуухан эргүүлнэ."}
              </p>
              <ol>
                <li>
                  <span>01</span> Камераа нүдний түвшинд барих
                </li>
                <li>
                  <span>02</span> Нүүрэн дээр сүүдэр үүсгэхгүй байх
                </li>
                <li>
                  <span>03</span>{" "}
                  {openGuide === "photo"
                    ? "Нүдээ нээлттэй, тайван харах"
                    : "Хөдөлгөөнөө удаан, жигд хийх"}
                </li>
              </ol>
              <button
                type="button"
                className="ns-modal-done"
                onClick={() => setOpenGuide(null)}
              >
                Ойлголоо
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BodyShapePicker({
  value,
  onChange,
  error,
}: {
  value: BodyShape | ""
  onChange: (value: BodyShape) => void
  error: string
}) {
  return (
    <fieldset className="ns-body-picker">
      <legend>
        <span>02</span>
        <div>
          <strong>Таны биеийн хэлбэр аль вэ?</strong>
          <small>
            Өөрт хамгийн ойр нэгийг сонгоно уу. Энэ нь хэмжээ биш, зөвхөн
            пропорцын тухай.
          </small>
        </div>
      </legend>
      <div className="ns-body-grid">
        {BODY_SHAPES.map((shape) => (
          <button
            key={shape.value}
            type="button"
            className={value === shape.value ? "selected" : ""}
            aria-pressed={value === shape.value}
            onClick={() => onChange(shape.value)}
          >
            <span className="ns-shape-check">
              <Icon name="check" size={12} />
            </span>
            <BodyShapeFigure shape={shape.value} />
            <strong>{shape.label}</strong>
            <small>{shape.hint}</small>
          </button>
        ))}
      </div>
      {error && (
        <p className="ns-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}

function UploadArea({
  file,
  preview,
  error,
  onFile,
}: {
  file: File | null
  preview: string
  error: string
  onFile: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const process = (files: FileList | null) => onFile(files?.[0] ?? null)
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    process(event.dataTransfer.files)
  }

  return (
    <div>
      <div
        className={`ns-upload ${dragging ? "is-dragging" : ""} ${
          file ? "has-file" : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            process(event.target.files)
          }
        />
        {file ? (
          <>
            {file.type.startsWith("video/") ? (
              <video src={preview} muted playsInline />
            ) : (
              <img src={preview} alt="Оруулсан зургийн урьдчилсан харагдац" />
            )}
            <div className="ns-file-overlay">
              <span className="ns-file-name">{file.name}</span>
              <div>
                <button type="button" onClick={() => inputRef.current?.click()}>
                  Солих
                </button>
                <button
                  type="button"
                  aria-label="Файл устгах"
                  onClick={() => onFile(null)}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            className="ns-upload-prompt"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <span className="ns-upload-icon">
              <Icon name="upload" size={22} />
            </span>
            <strong>Нүүрний зураг эсвэл бичлэгээ оруулна уу</strong>
            <span>Чирж тавих эсвэл төхөөрөмжөөсөө сонгох</span>
            <small>
              JPG, PNG, WEBP, HEIC — 20MB хүртэл
              <br />
              MP4, MOV, WEBM — 100MB хүртэл
            </small>
          </button>
        )}
      </div>
      {error && (
        <p className="ns-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function InputView({
  file,
  preview,
  fileError,
  setFile,
  preferences,
  setPreferences,
  bodyShapeError,
  submit,
}: {
  file: File | null
  preview: string
  fileError: string
  setFile: (file: File | null) => void
  preferences: StylistPreferences
  setPreferences: (value: StylistPreferences) => void
  bodyShapeError: string
  submit: () => void
}) {
  return (
    <div className="ns-input-view">
      <section className="ns-input-card">
        <div className="ns-card-heading">
          <span>01</span>
          <div>
            <h2>Таны зураг</h2>
            <p>
              Нүүр тод, урдаас авсан, байгалийн гэрэлтэй зураг хамгийн
              тохиромжтой.
            </p>
          </div>
        </div>
        <CaptureGuide />
        <UploadArea
          file={file}
          preview={preview}
          error={fileError}
          onFile={setFile}
        />
        <div className="ns-rule" />
        <BodyShapePicker
          value={preferences.bodyShape}
          onChange={(bodyShape) =>
            setPreferences({ ...preferences, bodyShape })
          }
          error={preferences.bodyShape ? "" : bodyShapeError}
        />
        <div className="ns-rule" />
        <div className="ns-card-heading compact">
          <span>03</span>
          <div>
            <h2>Товч сонголт</h2>
            <p>Тайланг таны амьдралд ойртуулахад тусална.</p>
          </div>
        </div>
        <ChipGroup
          label="Хаана ихэвчлэн өмсөх вэ?"
          values={OCCASIONS}
          selected={preferences.occasions}
          onChange={(occasions) =>
            setPreferences({ ...preferences, occasions })
          }
        />
        <ChipGroup
          label="Танд юу чухал вэ?"
          values={PRIORITIES}
          selected={preferences.priorities}
          onChange={(priorities) =>
            setPreferences({ ...preferences, priorities })
          }
        />
        <label className="ns-notes">
          <span>
            Нэмэлт хүсэлт <small>заавал биш</small>
          </span>
          <textarea
            maxLength={180}
            value={preferences.notes}
            onChange={(event) =>
              setPreferences({ ...preferences, notes: event.target.value })
            }
            placeholder="Жишээ нь: Оффисын хувцсаа шинэчилмээр байна..."
          />
          <small>{preferences.notes.length}/180</small>
        </label>
        <button className="ns-primary" type="button" onClick={submit}>
          <Icon name="sparkle" size={18} /> Миний стилийг тодорхойлох{" "}
          <span>→</span>
        </button>
        <p className="ns-limitation">
          Тайлан нь зөвлөмжийн шинжтэй бөгөөд биеийн хэмжээ, нас, гоо сайхны
          үнэлгээ хийдэггүй.
        </p>
      </section>
    </div>
  )
}

function LoadingView({ demo }: { demo: boolean }) {
  const [step, setStep] = useState(0)
  const steps = [
    "Дүрс ба пропорцыг ажиглаж байна",
    "Өнгө, контрастыг зураглаж байна",
    "Зөвлөмжийг боловсруулж байна",
  ]
  useEffect(() => {
    const timer = window.setInterval(
      () => setStep((current) => Math.min(current + 1, 2)),
      650,
    )
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className="ns-loading" aria-live="polite" aria-busy="true">
      <div className="ns-orbit">
        <span />
        <span />
        <Icon name="sparkle" size={26} />
      </div>
      <p className="ns-kicker">Naruka style reading</p>
      <h2>
        Таны стилийн хэлийг
        <br />
        уншиж байна
      </h2>
      {demo && (
        <div className="ns-demo-label">ДЕМО ШИНЖИЛГЭЭ · MOCK RESULT</div>
      )}
      <div className="ns-loading-steps">
        {steps.map((label, index) => (
          <div key={label} className={index <= step ? "done" : ""}>
            <span>
              {index < step ? <Icon name="check" size={13} /> : index + 1}
            </span>
            {label}
          </div>
        ))}
      </div>
      <p>Энэ нь ойролцоогоор хэдхэн секунд үргэлжилнэ.</p>
    </div>
  )
}

function DetailBlock({
  title,
  children,
  number,
}: {
  title: string
  children: ReactNode
  number: string
}) {
  return (
    <section className="ns-detail-block">
      <div className="ns-section-label">
        <span>{number}</span>
        {title}
      </div>
      {children}
    </section>
  )
}

function OutfitCard({
  outfit,
  saved,
  onSave,
}: {
  outfit: Outfit
  saved: boolean
  onSave: () => void
}) {
  return (
    <article className="ns-outfit">
      <div className="ns-outfit-image">
        <img src={outfit.image} alt={`${outfit.title} хувцаслалтын санаа`} />
        <button
          type="button"
          className={saved ? "saved" : ""}
          aria-label={saved ? "Хадгалснаас хасах" : "Хувцаслалтыг хадгалах"}
          onClick={onSave}
        >
          <Icon name="bookmark" size={18} />
        </button>
      </div>
      <div className="ns-outfit-copy">
        <span>{outfit.context}</span>
        <h4>{outfit.title}</h4>
        <p>{outfit.formula}</p>
      </div>
    </article>
  )
}

function ReportView({
  result,
  mock,
  saved,
  toggleSave,
  onEdit,
  onReset,
  onDemo,
}: {
  result: AnalysisResult
  mock: boolean
  saved: string[]
  toggleSave: (id: string) => void
  onEdit: () => void
  onReset: () => void
  onDemo: (archetype: Archetype) => void
}) {
  const [showSaved, setShowSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const shownOutfits = showSaved
    ? result.outfits.filter((item) => saved.includes(item.id))
    : result.outfits

  return (
    <div
      className="ns-report-wrap"
      data-archetype={result.archetype.toLowerCase()}
    >
      <div className="ns-report-toolbar ns-no-print">
        <div>
          <button type="button" onClick={onEdit}>
            <Icon name="edit" size={16} /> Мэдээлэл өөрчлөх
          </button>
          <button type="button" onClick={onReset}>
            <Icon name="reset" size={16} /> Шинээр эхлэх
          </button>
        </div>
        <div>
          <button
            type="button"
            className={showSaved ? "active" : ""}
            onClick={() => setShowSaved(!showSaved)}
          >
            <Icon name="bookmark" size={16} /> Хадгалсан <b>{saved.length}</b>
          </button>
          <button type="button" onClick={() => window.print()}>
            <Icon name="print" size={16} /> Хэвлэх
          </button>
        </div>
      </div>

      <article className="ns-report" id="naruka-stylist-report">
        <header className="ns-report-header">
          <div className="ns-wordmark">
            Naruka <i>Stylist</i>
          </div>
          <div className="ns-attribution">STYLE REPORT · NARUKA.MN</div>
        </header>

        {mock && (
          <div className="ns-mock-banner ns-no-print">
            <Icon name="sparkle" size={15} />
            <span>
              <strong>Демо үр дүн.</strong> Бодит шинжилгээ холбогдоогүй тул
              жишээ тайлан харуулж байна.
            </span>
          </div>
        )}

        <section className="ns-report-hero">
          <div className="ns-hero-index">01—04</div>
          <div className="ns-hero-copy">
            <p>{result.kicker}</p>
            <h1>
              {result.headline.split("\n").map((line, index) => (
                <span key={line}>{index === 1 ? <em>{line}</em> : line}</span>
              ))}
            </h1>
            <div className="ns-archetype-line">
              <span>Таны үндсэн архетип</span>
              <strong>{result.archetype}</strong>
            </div>
          </div>
          <div className="ns-match">
            <div
              style={
                { "--match": `${result.match * 3.6}deg` } as React.CSSProperties
              }
            >
              <span>
                {result.match}
                <small>%</small>
              </span>
            </div>
            <p>
              нийцлийн
              <br />
              түвшин
            </p>
          </div>
          <div className="ns-hero-image">
            <img src={result.outfits[0].image} alt="" />
            <span>
              {result.traits.map((trait) => (
                <i key={trait}>{trait}</i>
              ))}
            </span>
          </div>
        </section>

        <section className="ns-editor-note">
          <span>Stylist’s note</span>
          <p>{result.summary}</p>
        </section>

        <DetailBlock number="01" title="Таны өнгөний хэмнэл">
          <div className="ns-palette">
            {result.palette.map((color) => (
              <div key={color.hex}>
                <span style={{ background: color.hex }} />
                <p>
                  {color.name}
                  <small>{color.hex}</small>
                </p>
              </div>
            ))}
          </div>
          <p className="ns-guidance">
            Суурь өнгөө 60%, хоёрдогч өнгөө 30%, тод акцентаа 10% орчим
            ашиглавал хувцаслалт цэгцтэй атлаа сонирхолтой харагдана.
          </p>
        </DetailBlock>

        <DetailBlock number="02" title="Таны хэлбэрийн томъёо">
          <div className="ns-formula-grid">
            <div>
              <span>Силуэт</span>
              {result.silhouettes.map((item) => (
                <p key={item}>
                  <i>↗</i>
                  {item}
                </p>
              ))}
            </div>
            <div>
              <span>Материал</span>
              {result.fabrics.map((item) => (
                <p key={item}>
                  <i>↗</i>
                  {item}
                </p>
              ))}
            </div>
            <div>
              <span>Деталь</span>
              {result.details.map((item) => (
                <p key={item}>
                  <i>↗</i>
                  {item}
                </p>
              ))}
            </div>
          </div>
        </DetailBlock>

        <DetailBlock number="03" title="Танд зориулсан хувцаслалтууд">
          {showSaved && shownOutfits.length === 0 ? (
            <div className="ns-empty-saved">
              <Icon name="bookmark" size={22} />
              <p>Одоогоор хадгалсан хувцаслалт алга.</p>
              <button type="button" onClick={() => setShowSaved(false)}>
                Бүгдийг харах
              </button>
            </div>
          ) : (
            <div className="ns-outfit-grid">
              {shownOutfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  saved={saved.includes(outfit.id)}
                  onSave={() => toggleSave(outfit.id)}
                />
              ))}
            </div>
          )}
        </DetailBlock>

        <DetailBlock number="04" title="Анхаарах жижиг зүйлс">
          <div className="ns-avoid">
            <div>
              <span>Илүү их туршаарай</span>
              {result.details.slice(0, 2).map((item) => (
                <p key={item}>
                  <Icon name="check" size={15} />
                  {item}
                </p>
              ))}
            </div>
            <div>
              <span>Бага хэрэглээрэй</span>
              {result.avoid.map((item) => (
                <p key={item}>
                  <Icon name="close" size={15} />
                  {item}
                </p>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="ns-expand ns-no-print"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            Яагаад энэ зөвлөмж тохирох вэ? <Icon name="chevron" size={18} />
          </button>
          {expanded && (
            <div className="ns-expanded">
              Эдгээр зөвлөмж нь зөвхөн зурагт харагдах шугам, контраст болон
              таны сонгосон хэрэгцээнд тулгуурласан. “Зайлсхийх” хэсэг нь хатуу
              дүрэм биш—өөртөө таалагдсан бүхнийг өмсөх эрх чөлөө үргэлж танд
              бий.
            </div>
          )}
        </DetailBlock>

        <section className="ns-demo-switcher ns-no-print">
          <p>
            <span>Демо сан</span>Бусад архетипийн тайланг үзэх
          </p>
          <div>
            {ARCHETYPES.map((item) => (
              <button
                type="button"
                key={item}
                className={item === result.archetype ? "active" : ""}
                onClick={() => onDemo(item)}
              >
                {item}
                <span>→</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="ns-report-footer">
          <div className="ns-wordmark">
            Naruka <i>Stylist</i>
          </div>
          <p>
            Энэ тайлан бол чиглүүлэх зөвлөмж болохоос тогтсон дүрэм биш.
            <br />
            Өөрт таалагдсан хувцас таны хамгийн зөв стиль.
          </p>
          <span>NARUKA.MN</span>
        </footer>
      </article>
    </div>
  )
}

export function NarukaStylist({
  onAnalyze,
  className = "",
}: NarukaStylistProps) {
  const [view, setView] = useState<"input" | "loading" | "report">("input")
  const [file, setFileState] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [fileError, setFileError] = useState("")
  const [bodyShapeError, setBodyShapeError] = useState("")
  const [preferences, setPreferences] = useState<StylistPreferences>({
    occasions: [],
    priorities: [],
    notes: "",
    bodyShape: "",
  })
  const [result, setResult] = useState<AnalysisResult>(MOCK_RESULTS.Natural)
  const [saved, setSaved] = useState<string[]>([])
  const [analysisError, setAnalysisError] = useState("")

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  const validateAndSetFile = (next: File | null) => {
    setFileError("")
    if (!next) {
      setFileState(null)
      setPreview("")
      return
    }
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setFileError(
        "Дэмжигдэхгүй файл байна. JPG, PNG, WEBP, HEIC, MP4, MOV эсвэл WEBM сонгоно уу.",
      )
      return
    }
    const limit = next.type.startsWith("video/")
      ? MAX_VIDEO_SIZE
      : MAX_IMAGE_SIZE
    if (next.size > limit) {
      setFileError(
        `Файлын хэмжээ ${
          next.type.startsWith("video/") ? "100MB" : "20MB"
        }-аас бага байх шаардлагатай.`,
      )
      return
    }
    setFileState(next)
    setPreview(URL.createObjectURL(next))
  }

  const analyze = async () => {
    setFileError("")
    setBodyShapeError("")
    setAnalysisError("")
    if (!file) {
      setFileError("Шинжилгээ эхлүүлэхийн тулд зураг эсвэл видео оруулна уу.")
      return
    }
    if (!preferences.bodyShape) {
      setBodyShapeError("Өөрт хамгийн ойр биеийн хэлбэрийг сонгоно уу.")
      return
    }
    setView("loading")
    try {
      if (onAnalyze) {
        const next = await onAnalyze({ file, preferences })
        setResult(next)
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 2200))
        setResult(MOCK_RESULTS.Natural)
      }
      setView("report")
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Шинжилгээ хийх үед алдаа гарлаа. Дахин оролдоно уу.",
      )
      setView("input")
    }
  }

  const reset = () => {
    setFileState(null)
    setPreview("")
    setPreferences({
      occasions: [],
      priorities: [],
      notes: "",
      bodyShape: "",
    })
    setSaved([])
    setFileError("")
    setAnalysisError("")
    setView("input")
  }

  const rootClass = useMemo(
    () => `naruka-stylist ${className}`.trim(),
    [className],
  )

  return (
    <div className={rootClass}>
      <style>{STYLES}</style>
      <div className="ns-shell">
        <div className="ns-topline ns-no-print">
          <div className="ns-wordmark">
            Naruka <i>Stylist</i>
          </div>
          <span>PERSONAL STYLE READING</span>
        </div>
        {analysisError && (
          <div className="ns-global-error" role="alert">
            {analysisError}
          </div>
        )}
        {view === "input" && (
          <InputView
            file={file}
            preview={preview}
            fileError={fileError}
            setFile={validateAndSetFile}
            preferences={preferences}
            setPreferences={setPreferences}
            bodyShapeError={bodyShapeError}
            submit={analyze}
          />
        )}
        {view === "loading" && <LoadingView demo={!onAnalyze} />}
        {view === "report" && (
          <ReportView
            result={result}
            mock={!onAnalyze}
            saved={saved}
            toggleSave={(id) =>
              setSaved((items) =>
                items.includes(id)
                  ? items.filter((item) => item !== id)
                  : [...items, id],
              )
            }
            onEdit={() => setView("input")}
            onReset={reset}
            onDemo={(archetype) => {
              setResult(MOCK_RESULTS[archetype])
              setSaved([])
              setView("report")
            }}
          />
        )}
      </div>
    </div>
  )
}

const STYLES = `
.naruka-stylist{--ink:#232622;--paper:#f3f0e8;--card:#fbfaf6;--muted:#6f716b;--line:#d9d5ca;--accent:#866c46;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;width:100%;container-type:inline-size}
.naruka-stylist *{box-sizing:border-box}.naruka-stylist button,.naruka-stylist textarea{font:inherit}.naruka-stylist button{color:inherit}.ns-shell{background:var(--paper);border:1px solid #ddd8cc;min-height:720px;overflow:hidden}.ns-topline{height:68px;padding:0 4.5%;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.ns-wordmark{font-family:Georgia,serif;font-size:21px;letter-spacing:-.7px}.ns-wordmark i{font-weight:400;color:#8b6546}.ns-topline>span,.ns-attribution{font-size:9px;letter-spacing:.2em;color:#72746d}
.ns-input-view{display:grid;grid-template-columns:.9fr 1.1fr;min-height:720px}.ns-intro{padding:9% 9% 8% 10%;border-right:1px solid var(--line);display:flex;flex-direction:column}.ns-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.18em;display:flex;align-items:center;gap:10px;color:#5f625c}.ns-eyebrow span{width:26px;border-top:1px solid}.ns-intro h1{font-family:Georgia,serif;font-size:clamp(38px,5.2cqw,68px);font-weight:400;line-height:.99;letter-spacing:-.055em;margin:64px 0 25px;max-width:620px}.ns-intro h1 em{font-weight:400;color:#9a6f55}.ns-intro>p{font-family:Georgia,serif;font-size:16px;line-height:1.65;color:#686b64;max-width:430px}.ns-steps{padding:0;margin:auto 0 0;list-style:none;display:flex;gap:0;border-top:1px solid var(--line)}.ns-steps li{flex:1;padding-top:16px;color:#a09f98;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.ns-steps li span{display:block;font-family:Georgia,serif;font-size:16px;margin-bottom:6px}.ns-steps li.active{color:var(--ink);border-top:2px solid var(--ink);margin-top:-1px}
.ns-input-card{background:var(--card);padding:7% 8%}.ns-card-heading{display:grid;grid-template-columns:40px 1fr;gap:10px;margin-bottom:22px}.ns-card-heading>span{font-family:Georgia,serif;color:#9c7656;font-style:italic}.ns-card-heading h2{font-family:Georgia,serif;font-size:25px;font-weight:400;letter-spacing:-.03em;margin:0 0 5px}.ns-card-heading p{font-size:11px;color:var(--muted);margin:0;line-height:1.5}.ns-card-heading.compact{margin-bottom:16px}.ns-upload{height:248px;border:1px dashed #aaa89f;position:relative;overflow:hidden;transition:.2s;background:#f4f1e9}.ns-upload.is-dragging{border-color:#6e5742;background:#eee7da}.ns-upload input{position:absolute;width:1px;height:1px;opacity:0}.ns-upload-prompt{border:0;background:transparent;width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:pointer}.ns-upload-icon{width:46px;height:46px;border:1px solid #b7b3a8;border-radius:50%;display:grid;place-items:center;margin-bottom:14px}.ns-upload-prompt strong{font-family:Georgia,serif;font-size:16px;font-weight:400}.ns-upload-prompt>span:not(.ns-upload-icon){font-size:11px;color:#777972;margin-top:5px}.ns-upload-prompt small{font-size:9px;line-height:1.5;color:#a09e96;margin-top:17px}.ns-upload.has-file img,.ns-upload.has-file video{width:100%;height:100%;object-fit:cover}.ns-file-overlay{position:absolute;inset:auto 0 0;display:flex;align-items:center;justify-content:space-between;padding:30px 14px 12px;background:linear-gradient(transparent,rgba(15,16,14,.8));color:#fff}.ns-file-name{font-size:11px;max-width:55%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ns-file-overlay div{display:flex;gap:7px}.ns-file-overlay button{border:1px solid rgba(255,255,255,.6);background:rgba(0,0,0,.2);color:#fff;height:30px;padding:0 10px;font-size:10px;cursor:pointer}.ns-rule{border-top:1px solid var(--line);margin:28px 0 24px}.ns-fieldset{border:0;padding:0;margin:0 0 17px}.ns-fieldset legend,.ns-notes>span{font-size:10px;font-weight:600;margin-bottom:9px}.ns-chips{display:flex;gap:7px;flex-wrap:wrap}.ns-chips button{border:1px solid #d2cec4;border-radius:30px;background:transparent;padding:8px 12px;font-size:10px;display:flex;gap:5px;align-items:center;cursor:pointer}.ns-chips button[aria-pressed=true]{background:#31342f;color:#fff;border-color:#31342f}.ns-notes{display:block;position:relative}.ns-notes>span{display:block}.ns-notes>span small{font-weight:400;color:#999;margin-left:5px}.ns-notes textarea{width:100%;min-height:66px;resize:vertical;background:#f6f4ee;border:1px solid #d5d1c7;padding:10px 12px;font-size:11px;outline:none}.ns-notes textarea:focus{border-color:#7c6b58}.ns-notes>small{position:absolute;right:9px;bottom:8px;font-size:8px;color:#aaa}.ns-consent{display:flex;gap:9px;align-items:flex-start;margin-top:16px;cursor:pointer}.ns-consent input{position:absolute;opacity:0}.ns-check{width:17px;height:17px;border:1px solid #aaa69c;display:grid;place-items:center;flex:0 0 auto;color:transparent}.ns-consent input:checked+.ns-check{background:#333731;border-color:#333731;color:#fff}.ns-consent>span:last-child{font-size:9px;line-height:1.5;color:#73756f}.ns-consent.has-error .ns-check{border-color:#a54c40}.ns-error{font-size:10px;color:#a04437;margin:7px 0}.ns-primary{width:100%;height:49px;margin-top:17px;border:0;background:#2b2f2b;color:#fff;display:flex;align-items:center;justify-content:center;gap:9px;font-size:11px;letter-spacing:.03em;cursor:pointer;transition:.2s}.ns-primary:hover{background:#444940}.ns-primary span{margin-left:auto;margin-right:17px;font-size:18px}.ns-primary svg{margin-left:17px}.ns-limitation{text-align:center;font-size:8px;color:#999b94;margin:10px 0 0}.ns-global-error{margin:20px 4.5% 0;padding:12px;border:1px solid #c99d92;color:#8f3d32;font-size:11px;background:#fff6f2}
.ns-input-view{display:block;min-height:720px;padding:46px 4%;background:var(--paper)}.ns-input-card{width:min(900px,100%);margin:0 auto;background:var(--card);padding:6% 7%;box-shadow:0 12px 38px rgba(55,51,43,.07)}
.ns-capture-guide{border:1px solid #d9d4c8;background:#f2efe7;margin:-4px 0 18px}.ns-guide-title{padding:19px 22px 16px;border-bottom:1px solid #d9d4c8}.ns-guide-title>span{font-size:8px;letter-spacing:.17em;color:#906c4e}.ns-guide-title h3{font-family:Georgia,serif;font-size:20px;font-weight:400;margin:5px 0}.ns-guide-title p{font-size:10px;color:#74766f;margin:0}.ns-guide-options{display:grid;grid-template-columns:1fr 1fr}.ns-guide-options>div{display:grid;grid-template-columns:42px 1fr;gap:12px;padding:20px 22px}.ns-guide-options>div:first-child{border-right:1px solid #d9d4c8}.ns-guide-icon{width:38px;height:38px;border:1px solid #aaa69c;border-radius:50%;display:grid;place-items:center;color:#705a43}.ns-guide-icon svg{width:20px;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}.ns-guide-options strong{font-family:Georgia,serif;font-size:14px;font-weight:400}.ns-guide-options ol{padding:0;margin:8px 0 0;list-style-position:inside}.ns-guide-options li{font-size:9px;color:#73756e;line-height:1.8}.ns-guide-note{border-top:1px solid #d9d4c8;padding:10px 20px;display:flex;align-items:center;gap:8px;font-size:9px;color:#62655f;background:#e9e5da}.ns-guide-note svg{color:#785f45;flex:0 0 auto}
.ns-guide-card-title{display:flex;align-items:center;gap:8px}.ns-info-button{position:relative;width:21px;height:21px;padding:0;border:1px solid #2f8b5b;border-radius:50%;background:#359764;color:#fff!important;font-family:Georgia,serif!important;font-size:12px!important;font-weight:700;font-style:italic;line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 0 0 3px rgba(53,151,100,.1);transition:.18s;animation:ns-info-breathe 1.8s ease-in-out infinite}.ns-info-button:after{content:"";position:absolute;inset:-5px;border:1px solid rgba(53,151,100,.55);border-radius:50%;animation:ns-info-ring 1.8s ease-out infinite}.ns-info-button:hover{background:#277c4e;color:#fff!important;transform:scale(1.08);animation:none}.ns-info-ping{position:absolute;right:-3px;top:-3px;width:7px;height:7px;border:2px solid #f2efe7;border-radius:50%;background:#65ce8e;z-index:2}.ns-face-modal{position:fixed;inset:0;z-index:9999;background:rgba(22,25,23,.72);backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px;animation:ns-fade-in .2s ease}.ns-face-dialog{width:min(720px,100%);max-height:min(680px,92vh);overflow:auto;display:grid;grid-template-columns:.88fr 1.12fr;background:#faf9f5;box-shadow:0 28px 90px rgba(0,0,0,.32);position:relative;animation:ns-dialog-in .34s cubic-bezier(.2,.8,.2,1)}.ns-modal-close{position:absolute;right:14px;top:14px;z-index:6;width:34px;height:34px;border:1px solid #d4d1c9;border-radius:50%;background:rgba(250,249,245,.94);display:grid;place-items:center;cursor:pointer}.ns-verification-demo{min-height:490px;background:#e8ebe7;display:grid;place-items:center;padding:34px}.ns-phone-frame{width:230px;aspect-ratio:.72;border:1px solid rgba(255,255,255,.85);border-radius:28px;position:relative;overflow:hidden;background:#cfd5d1;box-shadow:0 18px 42px rgba(38,48,42,.18)}.ns-phone-frame:before{content:"";position:absolute;z-index:2;left:50%;top:42px;transform:translateX(-50%);width:158px;height:208px;border:1.5px solid rgba(235,243,238,.85);border-radius:48% 48% 43% 43%;box-shadow:0 0 0 999px rgba(24,32,28,.17)}.ns-face-model{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 42%;filter:saturate(.78) contrast(.94);transform:scale(1.06);animation:ns-face-breathe 2.8s ease-in-out infinite}.ns-corner{position:absolute;width:28px;height:28px;border-color:#a8e4bf;border-style:solid;z-index:3}.ns-corner.top-left{left:24px;top:30px;border-width:2px 0 0 2px;border-radius:8px 0 0}.ns-corner.top-right{right:24px;top:30px;border-width:2px 2px 0 0;border-radius:0 8px 0 0}.ns-corner.bottom-left{left:24px;bottom:50px;border-width:0 0 2px 2px;border-radius:0 0 0 8px}.ns-corner.bottom-right{right:24px;bottom:50px;border-width:0 2px 2px 0;border-radius:0 0 8px}.ns-scan-line{position:absolute;z-index:4;left:32px;right:32px;top:58px;height:1px;background:#7be0a4;box-shadow:0 0 12px #56cc86;animation:ns-face-scan 2.4s ease-in-out infinite}.ns-status-dot{position:absolute;z-index:4;left:50%;bottom:28px;transform:translateX(-50%);width:7px;height:7px;border-radius:50%;background:#78d99e;box-shadow:0 0 0 5px rgba(120,217,158,.2);animation:ns-status 1.4s ease infinite}.ns-phone-frame>small{position:absolute;z-index:4;left:10px;right:10px;bottom:10px;text-align:center;color:rgba(255,255,255,.9);font-size:6px;letter-spacing:.12em;text-shadow:0 1px 5px rgba(0,0,0,.6)}.ns-turn-arrow{position:absolute;top:46%;z-index:4;color:#a8e4bf;font-family:Georgia,serif;font-size:34px;text-shadow:0 1px 8px rgba(0,0,0,.35);animation:ns-arrow-pulse 1.3s ease-in-out infinite}.ns-turn-arrow.left{left:13px}.ns-turn-arrow.right{right:13px;animation-delay:.2s}.ns-phone-frame.is-video .ns-face-model{animation:ns-photo-turn 3.2s ease-in-out infinite}.ns-modal-copy{padding:58px 46px 42px}.ns-modal-copy>span{font-size:8px;letter-spacing:.18em;color:#4d865f}.ns-modal-copy h3{font-family:Georgia,serif;font-size:30px;line-height:1.05;font-weight:400;letter-spacing:-.035em;margin:10px 0 16px}.ns-modal-copy>p{font-size:11px;line-height:1.7;color:#6f716b;margin:0 0 25px}.ns-modal-copy ol{padding:0;margin:0;list-style:none;border-top:1px solid #dedbd3}.ns-modal-copy li{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #dedbd3;font-size:10px}.ns-modal-copy li span{font-family:Georgia,serif;color:#4d865f;font-style:italic}.ns-modal-done{width:100%;height:43px;margin-top:25px;border:0;background:#303530;color:#fff!important;font-size:10px;cursor:pointer}.ns-modal-done:hover{background:#485047}@keyframes ns-fade-in{from{opacity:0}}@keyframes ns-dialog-in{from{opacity:0;transform:translateY(18px) scale(.97)}}@keyframes ns-info-breathe{50%{box-shadow:0 0 0 5px rgba(53,151,100,.08);transform:scale(1.04)}}@keyframes ns-info-ring{0%{opacity:.8;transform:scale(.75)}75%,100%{opacity:0;transform:scale(1.45)}}@keyframes ns-face-scan{0%,100%{top:58px;opacity:.4}50%{top:238px;opacity:1}}@keyframes ns-status{50%{box-shadow:0 0 0 9px rgba(120,217,158,.05)}}@keyframes ns-face-breathe{50%{transform:scale(1.075)}}@keyframes ns-photo-turn{0%,100%{transform:scale(1.08) translateX(-2.5%)}50%{transform:scale(1.08) translateX(2.5%)}}@keyframes ns-arrow-pulse{50%{opacity:.35;transform:translateX(-3px)}}
.ns-body-picker{border:0;padding:0;margin:0}.ns-body-picker legend{display:grid;grid-template-columns:40px 1fr;gap:10px;width:100%;margin-bottom:20px}.ns-body-picker legend>span{font-family:Georgia,serif;color:#9c7656;font-style:italic}.ns-body-picker legend strong{display:block;font-family:Georgia,serif;font-size:25px;font-weight:400;letter-spacing:-.03em}.ns-body-picker legend small{display:block;font-size:10px;line-height:1.5;color:var(--muted);margin-top:5px}.ns-body-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.ns-body-grid button{position:relative;border:1px solid #d7d2c7;background:#f5f2eb;padding:12px 5px 10px;min-width:0;cursor:pointer;transition:.18s}.ns-body-grid button:hover{border-color:#9c8b76;transform:translateY(-2px)}.ns-body-grid button.selected{border:2px solid #6f5a45;background:#eee7dc;padding:11px 4px 9px}.ns-body-grid svg{display:block;width:56px;height:78px;margin:0 auto 5px;fill:none;stroke:#4f534e;stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}.ns-body-grid .ns-body-fill{fill:#c9b7a0;stroke:none;opacity:.6}.ns-body-grid button.selected .ns-body-fill{fill:#927150;opacity:.75}.ns-body-grid button>strong{display:block;font-family:Georgia,serif;font-size:11px;font-weight:400;line-height:1.2;min-height:27px}.ns-body-grid button>small{display:block;font-size:7px;color:#8a8b84;line-height:1.25}.ns-shape-check{position:absolute;right:6px;top:6px;width:17px;height:17px;border-radius:50%;border:1px solid #c3beb3;display:grid;place-items:center;color:transparent}.ns-body-grid button.selected .ns-shape-check{background:#6f5a45;border-color:#6f5a45;color:#fff}
.ns-body-grid svg{width:74px;height:108px;margin-bottom:7px;overflow:visible}.ns-body-grid .ns-shape-zone{fill:rgba(73,151,139,.08);stroke:#68a99f;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:3 2;transition:.2s}.ns-body-grid .ns-model-head,.ns-body-grid .ns-model-hand{fill:#d7b49a;stroke:#665a51;stroke-width:1}.ns-body-grid .ns-model-hair{fill:#55453c;stroke:#55453c;stroke-width:1}.ns-body-grid .ns-model-neck,.ns-body-grid .ns-model-limb,.ns-body-grid .ns-model-foot{fill:none;stroke:#665a51;stroke-width:3.6;stroke-linecap:round}.ns-body-grid .ns-model-suit{fill:#303532;stroke:#252a27;stroke-width:1}.ns-body-grid .ns-model-neckline{fill:none;stroke:#eee9df;stroke-width:1.2}.ns-body-grid button:hover .ns-shape-zone,.ns-body-grid button.selected .ns-shape-zone{fill:rgba(47,139,91,.13);stroke:#2f8b5b;stroke-width:3}.ns-body-grid button.selected .ns-model-suit{fill:#1e2823}.ns-body-grid button.selected svg{transform:scale(1.025)}.ns-body-grid button:nth-child(2) .ns-shape-zone{stroke:#6b9eb0}.ns-body-grid button:nth-child(3) .ns-shape-zone{stroke:#b88c55}.ns-body-grid button:nth-child(4) .ns-shape-zone{stroke:#798f69}.ns-body-grid button:nth-child(5) .ns-shape-zone{stroke:#8975a2}.ns-body-grid button:nth-child(6) .ns-shape-zone{stroke:#ad7375}.ns-body-grid button.selected .ns-shape-zone{stroke:#2f8b5b}
.ns-loading{min-height:650px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:radial-gradient(circle at center,#faf8f1 0,#f1eee5 60%)}.ns-orbit{width:110px;height:110px;border:1px solid #bab5aa;border-radius:50%;display:grid;place-items:center;position:relative;color:#856948;margin-bottom:32px}.ns-orbit:before,.ns-orbit:after{content:"";position:absolute;border:1px solid #d7d1c4;border-radius:50%;inset:12px;animation:ns-pulse 1.8s ease-in-out infinite}.ns-orbit:after{inset:-12px;animation-delay:.3s}.ns-orbit span:first-child{position:absolute;width:8px;height:8px;border-radius:50%;background:#856948;top:6px;animation:ns-orbit 2s linear infinite;transform-origin:4px 49px}.ns-kicker{text-transform:uppercase;font-size:9px!important;letter-spacing:.22em;color:#8f7253!important}.ns-loading h2{font-family:Georgia,serif;font-size:36px;font-weight:400;letter-spacing:-.04em;line-height:1.08;margin:10px 0 16px}.ns-demo-label{font-size:8px;letter-spacing:.15em;border:1px solid #bdb6a8;padding:6px 10px;margin-bottom:26px}.ns-loading-steps{width:min(380px,80%);border-top:1px solid var(--line);margin-top:6px}.ns-loading-steps div{display:flex;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line);font-size:10px;color:#aaa;text-align:left}.ns-loading-steps div span{width:19px;height:19px;border:1px solid #ccc;border-radius:50%;display:grid;place-items:center;font-size:8px}.ns-loading-steps div.done{color:#393c37}.ns-loading-steps div.done span{background:#393c37;color:white;border-color:#393c37}.ns-loading>p:last-child{font-size:9px;color:#999;margin-top:22px}@keyframes ns-orbit{to{transform:rotate(360deg)}}@keyframes ns-pulse{50%{transform:scale(1.08);opacity:.4}}
.ns-report-wrap{--report-accent:#6f785e;--report-soft:#d8ddcf;--report-deep:#30382d;background:#dcd8cf;padding:22px 3.5% 44px}.ns-report-wrap[data-archetype=gamine]{--report-accent:#b44839;--report-soft:#ead2ca;--report-deep:#26302f}.ns-report-wrap[data-archetype=romantic]{--report-accent:#8a555c;--report-soft:#ead7d4;--report-deep:#51383e}.ns-report-wrap[data-archetype=dramatic]{--report-accent:#303d68;--report-soft:#d2d6e2;--report-deep:#171a23}.ns-report-toolbar{display:flex;justify-content:space-between;max-width:980px;margin:0 auto 18px}.ns-report-toolbar>div{display:flex;gap:6px}.ns-report-toolbar button{border:1px solid #bcb8ae;background:#ece9e1;height:34px;padding:0 11px;font-size:9px;display:flex;align-items:center;gap:6px;cursor:pointer}.ns-report-toolbar button.active{background:#2f332f;color:white}.ns-report-toolbar b{background:var(--report-accent);color:#fff;border-radius:10px;min-width:16px;height:16px;display:grid;place-items:center;font-size:8px}.ns-report{background:#f8f6ef;max-width:980px;margin:auto;box-shadow:0 12px 40px rgba(44,41,34,.12)}.ns-report-header{height:70px;padding:0 6%;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dcd8ce}.ns-mock-banner{display:flex;align-items:center;justify-content:center;gap:8px;padding:9px 15px;background:#eee3d1;color:#6c5639;font-size:9px}.ns-report-hero{min-height:520px;display:grid;grid-template-columns:7% 48% 1fr;grid-template-rows:auto 1fr;position:relative;overflow:hidden}.ns-hero-index{font-size:8px;letter-spacing:.15em;padding:45px 0 0;text-align:center;writing-mode:vertical-rl}.ns-hero-copy{padding:75px 4% 40px 8%;z-index:2}.ns-hero-copy>p{font-size:9px;text-transform:uppercase;letter-spacing:.22em;color:var(--report-accent);margin:0 0 22px}.ns-hero-copy h1{font-family:Georgia,serif;font-size:clamp(44px,6cqw,73px);font-weight:400;line-height:.9;letter-spacing:-.06em;margin:0}.ns-hero-copy h1 span{display:block}.ns-hero-copy h1 em{color:var(--report-accent);font-weight:400}.ns-archetype-line{display:flex;align-items:end;gap:16px;margin-top:45px}.ns-archetype-line span{font-size:8px;text-transform:uppercase;letter-spacing:.15em;max-width:70px}.ns-archetype-line strong{font-family:Georgia,serif;font-size:28px;font-weight:400;font-style:italic;border-bottom:1px solid var(--ink)}.ns-match{position:absolute;right:35%;top:38px;z-index:3;display:flex;align-items:center;gap:8px}.ns-match>div{width:72px;height:72px;border-radius:50%;background:conic-gradient(var(--report-accent) var(--match),#dedbd3 0);display:grid;place-items:center}.ns-match>div:before{content:"";position:absolute;width:61px;height:61px;background:#f8f6ef;border-radius:50%}.ns-match span{font-family:Georgia,serif;font-size:21px;z-index:1}.ns-match small{font:8px sans-serif}.ns-match p{font-size:7px;text-transform:uppercase;letter-spacing:.12em}.ns-hero-image{grid-column:3;grid-row:1/3;min-height:520px;position:relative}.ns-hero-image:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(248,246,239,.15),transparent 30%);z-index:1}.ns-hero-image img{width:100%;height:100%;object-fit:cover;filter:saturate(.78) contrast(.95)}.ns-hero-image>span{position:absolute;z-index:2;bottom:25px;left:20px;right:20px;display:flex;gap:5px}.ns-hero-image i{font-style:normal;font-size:8px;letter-spacing:.08em;text-transform:uppercase;background:rgba(248,246,239,.88);padding:7px 9px}.ns-editor-note{display:grid;grid-template-columns:28% 1fr;padding:52px 9%;background:var(--report-deep);color:#f3f0e8}.ns-editor-note span{font-size:9px;text-transform:uppercase;letter-spacing:.18em;color:var(--report-soft)}.ns-editor-note p{font-family:Georgia,serif;font-size:21px;line-height:1.55;margin:0}.ns-detail-block{padding:64px 8%;border-bottom:1px solid #d9d5cc}.ns-section-label{font-size:10px;text-transform:uppercase;letter-spacing:.15em;display:flex;align-items:center;gap:14px;margin-bottom:37px}.ns-section-label span{font-family:Georgia,serif;font-size:19px;color:var(--report-accent);font-style:italic}.ns-palette{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.ns-palette>div>span{display:block;aspect-ratio:1.3}.ns-palette p{text-transform:uppercase;letter-spacing:.1em;font-size:8px}.ns-palette small{display:block;color:#96968f;margin-top:4px}.ns-guidance{font-family:Georgia,serif;font-size:15px;line-height:1.6;max-width:670px;margin:34px 0 0;padding-left:18px;border-left:2px solid var(--report-accent);color:#5f625c}.ns-formula-grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #d6d2c9}.ns-formula-grid>div{padding:26px 24px 10px;border-right:1px solid #d6d2c9}.ns-formula-grid>div:first-child{padding-left:0}.ns-formula-grid>div:last-child{border-right:0}.ns-formula-grid>div>span,.ns-avoid>div>span{display:block;font-family:Georgia,serif;font-size:19px;margin-bottom:18px;color:var(--report-accent)}.ns-formula-grid p{display:flex;gap:10px;font-size:10px;line-height:1.45}.ns-formula-grid i{font-style:normal;color:var(--report-accent)}.ns-outfit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.ns-outfit-image{aspect-ratio:.77;position:relative;overflow:hidden;background:#ddd}.ns-outfit-image img{width:100%;height:100%;object-fit:cover;filter:saturate(.7);transition:.4s}.ns-outfit:hover img{transform:scale(1.025)}.ns-outfit-image button{position:absolute;right:10px;top:10px;width:34px;height:34px;border:0;background:rgba(248,246,239,.88);display:grid;place-items:center;cursor:pointer}.ns-outfit-image button.saved{background:var(--report-accent);color:#fff}.ns-outfit-copy>span{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.14em;color:var(--report-accent);margin-top:15px}.ns-outfit-copy h4{font-family:Georgia,serif;font-size:18px;font-weight:400;margin:5px 0}.ns-outfit-copy p{font-size:9px;line-height:1.5;color:#73746e;margin:0}.ns-empty-saved{border:1px dashed #c8c4ba;padding:50px;text-align:center;color:#7b7c75}.ns-empty-saved p{font-family:Georgia,serif}.ns-empty-saved button{border:0;border-bottom:1px solid;background:transparent;font-size:10px;cursor:pointer}.ns-avoid{display:grid;grid-template-columns:1fr 1fr;gap:13%;}.ns-avoid>div{padding:25px;border-top:2px solid var(--report-accent);background:#f1eee6}.ns-avoid p{display:flex;gap:8px;align-items:center;font-size:10px}.ns-avoid svg{color:var(--report-accent)}.ns-expand{margin-top:26px;width:100%;display:flex;justify-content:space-between;border:0;border-top:1px solid #ccc8be;background:transparent;padding:18px 0;font-family:Georgia,serif;font-size:14px;cursor:pointer}.ns-expand[aria-expanded=true] svg{transform:rotate(180deg)}.ns-expanded{padding:0 0 18px;font-size:10px;line-height:1.7;color:#686b64;max-width:700px}.ns-demo-switcher{padding:48px 8%;background:var(--report-soft)}.ns-demo-switcher>p{font-family:Georgia,serif;font-size:20px}.ns-demo-switcher>p span{display:block;font:8px sans-serif;text-transform:uppercase;letter-spacing:.15em;margin-bottom:6px}.ns-demo-switcher>div{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.ns-demo-switcher button{border:1px solid color-mix(in srgb,var(--report-accent),transparent 55%);background:transparent;padding:14px;text-align:left;font-family:Georgia,serif;cursor:pointer;display:flex;justify-content:space-between}.ns-demo-switcher button.active{background:var(--report-deep);color:white}.ns-report-footer{padding:46px 8%;display:grid;grid-template-columns:1fr 2fr 1fr;align-items:end}.ns-report-footer p{text-align:center;font-size:8px;line-height:1.6;color:#85867f}.ns-report-footer>span{text-align:right;font-size:8px;letter-spacing:.16em}
@container (max-width: 760px){.ns-input-view{grid-template-columns:1fr}.ns-intro{min-height:520px;border-right:0;border-bottom:1px solid var(--line);padding:9%}.ns-intro h1{font-size:clamp(40px,11cqw,64px);margin-top:50px}.ns-input-card{padding:8%}.ns-report-hero{grid-template-columns:7% 52% 1fr;min-height:460px}.ns-hero-image{min-height:460px}.ns-hero-copy{padding-top:65px}.ns-match{right:28%;transform:scale(.82)}.ns-editor-note{grid-template-columns:1fr;gap:18px}.ns-detail-block{padding:50px 6%}}
@container (max-width: 540px){.ns-topline{height:58px;padding:0 5%}.ns-topline>span{display:none}.ns-intro{min-height:450px}.ns-steps li{font-size:8px}.ns-input-card{padding:28px 5%}.ns-upload{height:220px}.ns-report-wrap{padding:0}.ns-report-toolbar{padding:10px;flex-wrap:wrap;margin:0;gap:6px;background:#dcd8cf}.ns-report-toolbar button{padding:0 8px}.ns-report{box-shadow:none}.ns-report-header{height:60px}.ns-report-hero{display:flex;flex-direction:column;padding-top:0}.ns-hero-index{display:none}.ns-hero-copy{padding:48px 7% 30px}.ns-hero-copy h1{font-size:13cqw}.ns-match{right:5%;top:36px}.ns-match p{display:none}.ns-hero-image{height:430px;min-height:0;order:2}.ns-archetype-line{margin-top:30px}.ns-editor-note{padding:42px 7%}.ns-editor-note p{font-size:18px}.ns-detail-block{padding:45px 7%}.ns-palette{gap:4px}.ns-palette p{font-size:7px}.ns-palette small{display:none}.ns-formula-grid{grid-template-columns:1fr}.ns-formula-grid>div{padding:20px 0;border-right:0;border-bottom:1px solid #d6d2c9}.ns-outfit-grid{grid-template-columns:1fr;gap:30px}.ns-outfit-image{aspect-ratio:1}.ns-avoid{grid-template-columns:1fr;gap:12px}.ns-demo-switcher{padding:40px 7%}.ns-demo-switcher>div{grid-template-columns:1fr 1fr}.ns-report-footer{grid-template-columns:1fr;gap:15px;text-align:center}.ns-report-footer p,.ns-report-footer>span{text-align:center}.ns-report-footer .ns-wordmark{margin:auto}}
@container (max-width: 760px){.ns-input-view{padding:30px 3%}.ns-body-grid{grid-template-columns:repeat(3,1fr)}}
@container (max-width: 540px){.ns-input-view{padding:18px 0}.ns-input-card{box-shadow:none}.ns-guide-options{grid-template-columns:1fr}.ns-guide-options>div:first-child{border-right:0;border-bottom:1px solid #d9d4c8}.ns-body-grid{grid-template-columns:repeat(2,1fr)}.ns-body-grid svg{width:78px;height:116px}.ns-body-grid button>strong{font-size:12px}}
@container (max-width: 620px){.ns-face-dialog{grid-template-columns:1fr;max-width:390px}.ns-verification-demo{min-height:360px;padding:24px}.ns-phone-frame{width:190px}.ns-modal-copy{padding:34px 28px 28px}.ns-modal-copy h3{font-size:25px}.ns-face-figure{top:57px;transform:translateX(-50%) scale(.86)}.ns-phone-frame:before{width:136px;height:172px;top:38px}.ns-scan-line{left:28px;right:28px}}
@media (prefers-reduced-motion:reduce){.ns-info-button,.ns-info-button:after,.ns-face-modal,.ns-face-dialog,.ns-face-model,.ns-scan-line,.ns-status-dot,.ns-turn-arrow{animation:none!important}}
@media print{body *{visibility:hidden!important}.naruka-stylist,.naruka-stylist *,.ns-report,.ns-report *{visibility:visible!important}.naruka-stylist{position:absolute;left:0;top:0;width:100%;background:white}.ns-shell{border:0}.ns-no-print,.ns-topline{display:none!important}.ns-report-wrap{padding:0;background:white}.ns-report{box-shadow:none;max-width:none}.ns-report-hero{break-inside:avoid}.ns-detail-block{break-inside:avoid;padding-top:35px;padding-bottom:35px}.ns-outfit-image{max-height:280px}.ns-report-footer{break-inside:avoid}@page{margin:10mm}}
`

export default NarukaStylist
