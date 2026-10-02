import { useEffect, useMemo, useRef, useState } from 'react';
import narukaLogo from './assets/naruka-logo.png';
import rawQuizData from './imports/body_shape_test_MN_v2.json';

type ShapeId = 'apple' | 'pear' | 'hourglass' | 'rectangle' | 'inverted_triangle';
type Option = { id: string; label: string; feature_value?: string | null };
type Field = {
  id: string;
  type: string;
  label?: string;
  options?: Option[];
  disabled_when?: { field: string; equals: boolean };
};
type Question = {
  id: string;
  order: number;
  section_id: string;
  title: string;
  description?: string;
  help?: string;
  required: boolean;
  affects_shape?: boolean;
  type: string;
  unit?: string;
  options?: Option[];
  fields?: Field[];
  allow_skip?: boolean;
  quality_confirmation?: { label: string; required_for_classification: boolean };
};
type AnswerValue = string | string[] | Record<string, string | boolean | string[]>;
type Answers = Record<string, AnswerValue>;
type Step = 'intro' | 'photo' | 'profile' | 'questions' | 'processing' | 'results';

const quizData = rawQuizData as unknown as {
  test: {
    title: string;
    question_count: number;
    shape_question_count: number;
    description: string;
    disclaimer: string;
    estimated_duration_minutes: { min: number; max: number };
  };
  photo_upload: {
    title: string;
    description: string;
    instructions: string[];
    accepted_mime_types: string[];
    max_file_size_bytes: number;
  };
  ui: { instructions: string };
  sections: Array<{ id: string; title: string }>;
  questions: Question[];
  scoring: {
    questionnaire_sufficiency: { minimum_known_shape_answers: number };
    classification_rules: {
      rules: Array<{
        result: ShapeId;
        all: Array<{ feature: string; operator: 'eq' | 'in'; value: string | string[] }>;
      }>;
    };
  };
  result_types: Array<{
    id: ShapeId;
    label: string;
    description: string;
    starter_recommendations: string[];
  }>;
  recommendations: {
    principle: string;
    winter_context: string;
  };
};

const STORAGE_KEY = 'naruka-body-shape-test-v2';

function Icon({
  name,
  className = 'size-5',
}: {
  name: 'upload' | 'shield' | 'check' | 'body' | 'sparkle';
  className?: string;
}) {
  const paths = {
    upload: (
      <>
        <path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5" />
        <path d="M4 13.5v3.25A2.25 2.25 0 0 0 6.25 19h11.5A2.25 2.25 0 0 0 20 16.75V13.5" />
      </>
    ),
    shield: <path d="M12 3 5.5 5.75v5.5c0 4.1 2.75 7.1 6.5 8.75 3.75-1.65 6.5-4.65 6.5-8.75v-5.5L12 3Zm-3 8.5 2 2 4-4" />,
    check: <path d="m5 12 4 4L19 6" />,
    body: (
      <>
        <circle cx="12" cy="4.5" r="2.25" />
        <path d="M8.5 9.25c1.9-1.1 5.1-1.1 7 0l-1 5.25L16 21M9.5 14.5 8 21M7 10.5l-2 4M17 10.5l2 4" />
      </>
    ),
    sparkle: <path d="m12 2 1.2 4.3L17.5 7.5l-4.3 1.2L12 13l-1.2-4.3-4.3-1.2 4.3-1.2L12 2Zm5 11 .7 2.3 2.3.7-2.3.7L17 19l-.7-2.3L14 16l2.3-.7L17 13Z" />,
  };
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group w-full rounded-full bg-bordeaux px-6 py-4 font-semibold text-white shadow-lg shadow-bordeaux/15 transition-all hover:-translate-y-0.5 hover:bg-bordeaux-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
    >
      <span className="flex items-center justify-center gap-2">
        {children}
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </button>
  );
}

function BodyProportionSketch({ shape }: { shape?: ShapeId }) {
  const silhouettes: Record<ShapeId, string> = {
    apple:
      'M66 62 C57 78 50 102 51 128 C52 153 60 174 69 190 L74 230 L106 230 L111 190 C120 174 128 153 129 128 C130 102 123 78 114 62 C100 68 80 68 66 62 Z',
    pear:
      'M70 62 C66 85 70 108 72 129 C59 143 51 163 48 184 L69 193 L75 230 L105 230 L111 193 L132 184 C129 163 121 143 108 129 C110 108 114 85 110 62 C98 68 82 68 70 62 Z',
    hourglass:
      'M63 62 C57 81 60 105 72 126 C64 145 57 163 56 181 L72 192 L76 230 L104 230 L108 192 L124 181 C123 163 116 145 108 126 C120 105 123 81 117 62 C102 69 78 69 63 62 Z',
    rectangle:
      'M68 62 C64 91 65 119 66 148 L68 190 L75 230 L105 230 L112 190 L114 148 C115 119 116 91 112 62 C99 67 81 67 68 62 Z',
    inverted_triangle:
      'M57 62 C59 88 69 109 76 128 C78 148 75 169 70 190 L76 230 L104 230 L110 190 C105 169 102 148 104 128 C111 109 121 88 123 62 C104 70 76 70 57 62 Z',
  };
  const activeShape = shape || 'rectangle';

  return (
    <div className="relative mx-auto w-full max-w-xs rounded-3xl bg-cream-dark/70 p-5">
      <svg viewBox="0 0 180 250" className="mx-auto h-64 w-auto" aria-label="Биеийн пропорцын зураглал">
        <circle cx="90" cy="30" r="18" className="fill-white stroke-gold" strokeWidth="2" />
        <path d={silhouettes[activeShape]} className="fill-blush stroke-bordeaux" strokeWidth="2.5" />
        {[
          [68, 'Мөр'],
          [128, 'Бэлхүүс'],
          [181, 'Ташаа'],
        ].map(([y, label]) => (
          <g key={label}>
            <line x1="28" x2="152" y1={y} y2={y} className="stroke-gold/60" strokeDasharray="4 5" />
            <text x="154" y={Number(y) + 4} className="fill-muted text-[8px]">
              {label}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-xs leading-relaxed text-muted">
        Таны хариултад тулгуурласан пропорцын ерөнхий зураглал
      </p>
    </div>
  );
}

export default function KibbeQuiz({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('intro');
  const [current, setCurrent] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [preference, setPreference] = useState('');
  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').answers || {};
    } catch {
      return {};
    }
  });
  const [measurementConfirmed, setMeasurementConfirmed] = useState<Record<string, boolean>>({});
  const [reportEmail, setReportEmail] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const question = quizData.questions[current];
  const sectionTitle =
    quizData.sections.find((section) => section.id === question?.section_id)?.title || '';

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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ answers, measurementConfirmed, preference, updatedAt: new Date().toISOString() }),
    );
  }, [answers, measurementConfirmed, preference]);

  const progress =
    step === 'intro'
      ? 0
      : step === 'photo'
        ? 6
        : step === 'profile'
          ? 10
          : step === 'questions'
            ? Math.round(10 + ((current + 1) / quizData.questions.length) * 86)
            : 100;

  const result = useMemo(() => {
    const classificationRules = quizData.scoring?.classification_rules?.rules ?? [];
    const resultTypes = quizData.result_types ?? [];
    const featureValue = (questionId: string) => {
      const item = quizData.questions.find((candidate) => candidate.id === questionId);
      const answer = answers[questionId];
      if (!item || typeof answer !== 'string') return null;
      return item.options?.find((option) => option.id === answer)?.feature_value ?? null;
    };

    const relationValues = ['q01', 'q02', 'q05'].map(featureValue).filter(Boolean) as string[];
    const relationCounts = relationValues.reduce<Record<string, number>>((counts, value) => {
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
    const sortedRelations = Object.entries(relationCounts).sort((a, b) => b[1] - a[1]);
    let upperLowerRelation: string | null = null;
    if (relationValues.length >= 2 && sortedRelations[0]) {
      upperLowerRelation =
        sortedRelations[1]?.[1] === sortedRelations[0][1] ? 'conflicting' : sortedRelations[0][0];
    }

    const waistValues = ['q03', 'q06'].map(featureValue).filter(Boolean) as string[];
    const waistDefinition =
      waistValues.length === 0
        ? null
        : waistValues.every((value) => value === waistValues[0])
          ? waistValues[0]
          : 'conflicting';
    const midsection = featureValue('q04');
    const features: Record<string, string | null> = {
      upper_lower_relation: upperLowerRelation,
      waist_definition: waistDefinition,
      midsection,
    };

    const knownAnswers = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06']
      .map(featureValue)
      .filter(Boolean).length;
    const conflicting = Object.values(features).includes('conflicting');
    const matchedRule = !conflicting
      ? classificationRules.find((rule) =>
          rule.all.every((condition) => {
            const value = features[condition.feature];
            return condition.operator === 'eq'
              ? value === condition.value
              : Array.isArray(condition.value) && Boolean(value) && condition.value.includes(value);
          }),
        )
      : undefined;
    const shape = resultTypes.find((item) => item.id === matchedRule?.result);

    return { shape, knownAnswers, conflicting, features };
  }, [answers]);

  function handlePhoto(file?: File) {
    setPhotoError('');
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isSupportedImage =
      file.type.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(extension || '');
    if (!isSupportedImage) {
      setPhotoError('JPG, PNG, WEBP, HEIC эсвэл HEIF зураг сонгоно уу.');
      return;
    }
    if (file.size > quizData.photo_upload.max_file_size_bytes) {
      setPhotoError('Зургийн хэмжээ 10 MB-аас бага байна.');
      return;
    }
    setPhoto(file);
  }

  function toggleOption(optionId: string) {
    if (question.type === 'multiple_choice') {
      const selected = (answers[question.id] as string[]) || [];
      setAnswers({
        ...answers,
        [question.id]: selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId],
      });
      return;
    }
    setAnswers({ ...answers, [question.id]: optionId });
  }

  function updateField(field: Field, value: string | boolean | string[]) {
    const group = (answers[question.id] as Record<string, string | boolean | string[]>) || {};
    setAnswers({ ...answers, [question.id]: { ...group, [field.id]: value } });
  }

  function hasAnswer() {
    const answer = answers[question.id];
    if (!question.required) return true;
    if (typeof answer === 'string') return Boolean(answer);
    if (Array.isArray(answer)) return answer.length > 0;
    return Boolean(answer && Object.keys(answer).length);
  }

  function nextQuestion() {
    if (current === quizData.questions.length - 1) {
      setStep('processing');
      window.setTimeout(() => setStep('results'), 1800);
    } else {
      setCurrent((value) => value + 1);
    }
  }

  function goBack() {
    if (step === 'results') {
      setStep('questions');
      setCurrent(quizData.questions.length - 1);
    } else if (step === 'questions' && current > 0) {
      setCurrent((value) => value - 1);
    } else if (step === 'questions') {
      setStep('profile');
    } else if (step === 'profile') {
      setStep('photo');
    } else if (step === 'photo') {
      setStep('intro');
    }
  }

  function restart() {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setMeasurementConfirmed({});
    setPhoto(null);
    setPreference('');
    setReportEmail('');
    setReportSent(false);
    setCurrent(0);
    setStep('intro');
  }

  async function sendReport(event: React.FormEvent) {
    event.preventDefault();
    setReportSending(true);
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: reportEmail,
          source: 'body-shape-test',
          result: result.shape?.id,
          answers,
        }),
      });
    } catch {
      // The preview has no mail backend; keep the confirmation flow usable.
    } finally {
      setReportSending(false);
      setReportSent(true);
    }
  }

  const currentGroup =
    (answers[question?.id] as Record<string, string | boolean | string[]>) || {};

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-cream">
      <div className="pointer-events-none fixed -left-32 top-24 size-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 bottom-10 size-96 rounded-full bg-bordeaux/10 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-cream-dark bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Тест хаах"
            className="flex size-10 items-center justify-center rounded-full text-xl text-charcoal-soft transition hover:bg-white"
          >
            ×
          </button>
          <img src={narukaLogo} alt="Naruka Styling Studio" className="h-9 w-auto object-contain brightness-0" />
          <button
            type="button"
            onClick={goBack}
            disabled={step === 'intro' || step === 'processing'}
            className="rounded-full px-3 py-2 text-sm font-semibold text-bordeaux transition hover:bg-blush disabled:invisible"
          >
            Буцах
          </button>
        </div>
        <div className="h-1 bg-cream-dark">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-gold to-bordeaux transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-3xl px-4 py-7 sm:px-5 sm:py-10">
        {step === 'intro' && (
          <section className="animate-[fadeIn_.3s_ease-out] overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 shadow-xl shadow-charcoal/5 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-bordeaux to-bordeaux-light px-6 py-10 text-center text-white sm:px-12 sm:py-14">
              <p className="mx-auto mb-5 w-fit rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-light">
                Шинэ · Биеийн шугамын тест
              </p>
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-white/10 text-gold-light">
                <Icon name="body" className="size-9" />
              </div>
              <h2 className="font-display text-3xl leading-tight sm:text-5xl">
                Миний биеийн хэлбэр
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                {quizData.test.description}
              </p>
            </div>
            <div className="p-6 sm:p-10">
              <div className="mb-7 grid grid-cols-3 divide-x divide-cream-dark rounded-2xl bg-cream-dark/60 py-5 text-center">
                <div>
                  <p className="font-display text-2xl text-bordeaux">24</p>
                  <p className="mt-1 text-xs text-muted">асуулт</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-bordeaux">
                    {quizData.test.estimated_duration_minutes.min}–{quizData.test.estimated_duration_minutes.max}
                  </p>
                  <p className="mt-1 text-xs text-muted">минут</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-bordeaux">5</p>
                  <p className="mt-1 text-xs text-muted">биеийн хэлбэр</p>
                </div>
              </div>
              <PrimaryButton onClick={() => setStep('photo')}>
                Үргэлжлүүлэх
              </PrimaryButton>
            </div>
          </section>
        )}

        {step === 'photo' && (
          <section className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
            <p className="mb-4 w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">
              Зураг · 1-р алхам
            </p>
            <h2 className="font-display text-3xl leading-tight text-charcoal">
              {quizData.photo_upload.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {quizData.photo_upload.description}
            </p>

            <input
              ref={uploadRef}
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={(event) => handlePhoto(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="mt-7 flex min-h-72 w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-gold/50 bg-cream-dark/50 transition hover:border-bordeaux hover:bg-blush/40"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Оруулсан бүтэн биеийн зураг" className="max-h-[32rem] w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center px-6 text-center">
                  <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-white text-bordeaux shadow-sm">
                    <Icon name="upload" className="size-7" />
                  </span>
                  <strong className="text-charcoal">Зураг сонгох</strong>
                  <span className="mt-2 text-xs text-muted">
                    iPhone, Android · JPG, PNG, WEBP, HEIC · 10 MB хүртэл
                  </span>
                </span>
              )}
            </button>
            {photoError && <p className="mt-3 text-sm font-medium text-bordeaux">{photoError}</p>}

            <div className="my-6 rounded-2xl bg-cream-dark/70 p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <Icon name="check" className="size-4 text-bordeaux" /> Сайн зураг авах 4 зөвлөмж
              </p>
              <ul className="space-y-2 text-xs leading-relaxed text-muted">
                {quizData.photo_upload.instructions.slice(0, 4).map((instruction) => (
                  <li key={instruction} className="flex gap-2">
                    <span className="text-gold">•</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cream-dark bg-white p-4 text-xs leading-relaxed text-muted">
              <Icon name="shield" className="size-6 shrink-0 text-bordeaux" />
              Энэ прототипод зураг зөвхөн таны төхөөрөмж дээр урьдчилан харагдана, серверт
              илгээгдэхгүй.
            </div>
            <PrimaryButton onClick={() => setStep('profile')} disabled={!photo}>
              Зургаа баталгаажуулах
            </PrimaryButton>
          </section>
        )}

        {step === 'profile' && (
          <section className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
            <p className="mb-4 w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">
              Товч мэдээлэл · 2-р алхам
            </p>
            <h2 className="font-display text-3xl text-charcoal">Зөвлөмжөө өөртөө тохируулаарай</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Эдгээр мэдээлэл оноонд нөлөөлөхгүй бөгөөд зөвлөмжийг илүү хэрэгтэй болгоно.
            </p>
            <div className="mt-8 space-y-6">
              <fieldset>
                <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
                  Хувцасны сонголт
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['womenswear', 'Эмэгтэй загвар'],
                    ['menswear', 'Эрэгтэй загвар'],
                    ['unisex', 'Унисекс'],
                    ['mixed', 'Холимог'],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setPreference(value)}
                      className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${
                        preference === value
                          ? 'border-bordeaux bg-bordeaux text-white'
                          : 'border-cream-dark bg-white text-charcoal hover:border-gold'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="mt-8">
              <PrimaryButton onClick={() => setStep('questions')}>Асуултуудаа эхлүүлэх</PrimaryButton>
            </div>
          </section>
        )}

        {step === 'questions' && question && (
          <section
            key={question.id}
            className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9"
          >
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">
                  {sectionTitle}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Асуулт {current + 1} / {quizData.questions.length}
                </p>
              </div>
              {question.affects_shape && (
                <span className="rounded-full border border-cream-dark bg-white px-3 py-1.5 text-xs text-muted">
                  Хэлбэр тодорхойлоход ашиглана
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl leading-snug text-charcoal sm:text-3xl">
              {question.title}
            </h2>
            {(question.help || question.description) && (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {question.help || question.description}
              </p>
            )}

            {question.type === 'number' ? (
              <div className="mt-8">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                    Хэмжээ {question.unit && `(${question.unit})`}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={typeof answers[question.id] === 'string' ? String(answers[question.id]) : ''}
                    onChange={(event) =>
                      setAnswers({ ...answers, [question.id]: event.target.value })
                    }
                    placeholder="Хэмжээгээ оруулна уу"
                    className="w-full rounded-2xl border border-cream-dark bg-white px-5 py-4 text-charcoal outline-none transition focus:border-bordeaux"
                  />
                </label>
                {question.quality_confirmation && (
                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-cream-dark/60 p-4 text-sm text-charcoal-soft">
                    <input
                      type="checkbox"
                      checked={Boolean(measurementConfirmed[question.id])}
                      onChange={(event) =>
                        setMeasurementConfirmed({
                          ...measurementConfirmed,
                          [question.id]: event.target.checked,
                        })
                      }
                      className="size-4 accent-bordeaux"
                    />
                    {question.quality_confirmation.label}
                  </label>
                )}
              </div>
            ) : question.type !== 'group' ? (
              <div className="mt-8 space-y-3">
                {question.options?.map((option, index) => {
                  const answer = answers[question.id];
                  const selected = Array.isArray(answer)
                    ? answer.includes(option.id)
                    : answer === option.id;
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? 'border-bordeaux bg-bordeaux text-white shadow-md shadow-bordeaux/15'
                          : 'border-cream-dark bg-white text-charcoal hover:-translate-y-0.5 hover:border-gold hover:shadow-md'
                      }`}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          selected ? 'bg-white text-bordeaux' : 'bg-cream-dark text-bordeaux'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm font-semibold leading-snug sm:text-base">{option.label}</span>
                      {selected && <Icon name="check" className="ml-auto size-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                {question.fields?.map((field) => {
                  const disabled =
                    field.disabled_when &&
                    currentGroup[field.disabled_when.field] === field.disabled_when.equals;
                  if (field.type === 'boolean') {
                    return (
                      <label key={field.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-cream-dark bg-white p-4">
                        <input
                          type="checkbox"
                          checked={Boolean(currentGroup[field.id])}
                          onChange={(event) => updateField(field, event.target.checked)}
                          className="size-5 accent-bordeaux"
                        />
                        <span className="text-sm font-semibold text-charcoal">{field.label}</span>
                      </label>
                    );
                  }
                  if (field.options) {
                    const selected = (currentGroup[field.id] as string[]) || [];
                    return (
                      <fieldset key={field.id}>
                        {field.label && <legend className="mb-3 text-sm font-semibold text-charcoal">{field.label}</legend>}
                        <div className="grid gap-2 sm:grid-cols-2">
                          {field.options.map((option) => (
                            <button
                              type="button"
                              key={option.id}
                              onClick={() =>
                                updateField(
                                  field,
                                  selected.includes(option.id)
                                    ? selected.filter((id) => id !== option.id)
                                    : [...selected, option.id],
                                )
                              }
                              className={`rounded-2xl border p-3 text-left text-sm transition ${
                                selected.includes(option.id)
                                  ? 'border-bordeaux bg-bordeaux text-white'
                                  : 'border-cream-dark bg-white text-charcoal hover:border-gold'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    );
                  }
                  return (
                    <label key={field.id} className="block">
                      <span className="mb-2 block text-sm font-semibold text-charcoal">{field.label}</span>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={String(currentGroup[field.id] || '')}
                          onChange={(event) => updateField(field, event.target.value)}
                          disabled={disabled}
                          rows={4}
                          className="w-full rounded-2xl border border-cream-dark bg-white p-4 text-sm outline-none focus:border-bordeaux disabled:opacity-40"
                        />
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={String(currentGroup[field.id] || '')}
                          onChange={(event) => updateField(field, event.target.value)}
                          disabled={disabled}
                          className="w-full rounded-2xl border border-cream-dark bg-white p-4 text-sm outline-none focus:border-bordeaux disabled:opacity-40"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_2fr]">
              {question.allow_skip ? (
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="rounded-full border border-cream-dark bg-white px-5 py-4 text-sm font-semibold text-muted transition hover:border-gold hover:text-charcoal"
                >
                  Алгасах
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-full border border-cream-dark bg-white px-5 py-4 text-sm font-semibold text-muted transition hover:border-gold hover:text-charcoal"
                >
                  Буцах
                </button>
              )}
              <PrimaryButton onClick={nextQuestion} disabled={!hasAnswer()}>
                {current === quizData.questions.length - 1 ? 'Үр дүн гаргах' : 'Дараагийн асуулт'}
              </PrimaryButton>
            </div>
          </section>
        )}

        {step === 'processing' && (
          <section className="flex min-h-[65vh] animate-[fadeIn_.3s_ease-out] flex-col items-center justify-center text-center">
            <div className="relative flex size-28 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-bordeaux/10" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-bordeaux text-gold-light shadow-xl shadow-bordeaux/20">
                <Icon name="sparkle" className="size-9" />
              </div>
            </div>
            <h2 className="mt-7 font-display text-3xl text-charcoal">Таны биеийн хэлбэрийг нэгтгэж байна</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Зураг, үндсэн хариулт болон таны оруулсан хэмжээг харьцуулж байна.
            </p>
          </section>
        )}

        {step === 'results' && (
          <section className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
            <div className="text-center">
              <p className="mx-auto mb-4 w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">
                Таны биеийн хэлбэрийн тайлан
              </p>
              <h2 className="font-display text-4xl text-charcoal sm:text-5xl">
                {result.shape?.label || 'Хариултаа дахин нягтлаарай'}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
                {result.shape?.description ||
                  (result.conflicting
                    ? 'Үндсэн хариултууд хоорондоо зөрсөн тул нэг хэлбэрийг хүчээр сонгосонгүй.'
                    : 'Хэлбэр тодорхойлоход хангалттай үндсэн хариулт цуглараагүй байна.')}
              </p>
            </div>

            <div className="mt-8">
              <BodyProportionSketch shape={result.shape?.id} />
            </div>

            <div className="mt-9 rounded-3xl bg-cream-dark/70 p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-bordeaux">
                Үр дүн хэрхэн гарсан бэ?
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['Дээд ба доод хэсэг', result.features.upper_lower_relation],
                  ['Бэлхүүсний хэлбэр', result.features.waist_definition],
                  ['Дунд хэсэг', result.features.midsection],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white p-4">
                    <p className="text-xs leading-relaxed text-muted">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-charcoal">
                      {value === 'upper_wider'
                        ? 'Дээд хэсэг өргөн'
                        : value === 'lower_wider'
                          ? 'Доод хэсэг өргөн'
                          : value === 'similar'
                            ? 'Ойролцоо'
                            : value === 'defined'
                              ? 'Илт нарийн'
                              : value === 'slight'
                                ? 'Бага зэрэг нарийн'
                                : value === 'straight'
                                  ? 'Шулуун'
                                  : value === 'mid_wider' || value === 'yes'
                                    ? 'Дунд хэсэг давамгай'
                                    : value === 'no'
                                      ? 'Давамгай биш'
                                      : value === 'conflicting'
                                        ? 'Зөрүүтэй'
                                        : 'Тодорхойгүй'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-cream-dark bg-white p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-bordeaux">
                Туршиж үзэх хувцасны зөвлөмж
              </p>
              <ul className="mt-5 space-y-3">
                {(result.shape?.starter_recommendations || [
                  'Өөрт эвтэйхэн суулт, хэмжээг суурь болгон турших',
                  'Үндсэн 6 асуултын хариултаа зурагтайгаа дахин харьцуулах',
                ]).map((recommendation) => (
                  <li key={recommendation} className="flex gap-3 text-sm leading-relaxed text-charcoal-soft">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blush text-bordeaux">
                      <Icon name="check" className="size-3.5" />
                    </span>
                    {recommendation}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-cream-dark pt-4 text-xs leading-relaxed text-muted">
                {quizData.recommendations.principle}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-bordeaux to-bordeaux-light p-6 text-white sm:p-8">
              {reportSent ? (
                <div className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/15 text-gold-light">
                    <Icon name="check" className="size-6" />
                  </span>
                  <p className="mt-4 font-display text-2xl">Хүсэлтийг хүлээн авлаа</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/75">
                    Дэлгэрэнгүй тайлан, хувцаслалтын зөвлөмжийг {reportEmail} хаяг руу
                    илгээнэ.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-gold-light">
                    Таны хувийн дэлгэрэнгүй тайлан
                  </p>
                  <h3 className="mt-2 font-display text-2xl sm:text-3xl">
                    Зөвлөмжөө имэйлээр аваарай
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                    Таны биеийн хэлбэр, пропорц, хувцасны суулт, тохирох эсгүүр, материалын
                    дэлгэрэнгүй тайлан болон хэрэгжүүлэхэд хялбар зөвлөмжийг имэйл хаяг руу
                    тань илгээнэ.
                  </p>
                  <form onSubmit={sendReport} className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      required
                      value={reportEmail}
                      onChange={(event) => setReportEmail(event.target.value)}
                      placeholder="Имэйл хаягаа оруулна уу"
                      className="min-w-0 flex-1 rounded-full border border-white/20 bg-white px-5 py-4 text-sm text-charcoal outline-none placeholder:text-muted focus:border-gold"
                    />
                    <button
                      type="submit"
                      disabled={reportSending}
                      className="shrink-0 rounded-full bg-gold px-6 py-4 text-sm font-semibold text-white transition hover:bg-gold-light hover:text-charcoal disabled:opacity-60"
                    >
                      {reportSending ? 'Илгээж байна...' : 'Тайлангаа авах'}
                    </button>
                  </form>
                </>
              )}
            </div>

            {result.knownAnswers < quizData.scoring.questionnaire_sufficiency.minimum_known_shape_answers && (
              <p className="mt-5 rounded-2xl bg-blush p-4 text-sm leading-relaxed text-bordeaux">
                Илүү найдвартай чиглэл гаргахын тулд эхний 6 асуултаас дор хаяж{' '}
                {quizData.scoring.questionnaire_sufficiency.minimum_known_shape_answers}-д хүчинтэй
                хариулт өгнө үү.
              </p>
            )}

            <p className="mt-6 text-center text-xs leading-relaxed text-muted">
              {quizData.test.disclaimer} Зураг серверт хадгалагдаагүй.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={restart}
                className="rounded-full border border-cream-dark bg-white px-6 py-4 text-sm font-semibold text-muted transition hover:border-gold hover:text-charcoal"
              >
                Дахин бөглөх
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-bordeaux px-6 py-4 text-sm font-semibold text-white transition hover:bg-bordeaux-dark"
              >
                Дуусгах
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
