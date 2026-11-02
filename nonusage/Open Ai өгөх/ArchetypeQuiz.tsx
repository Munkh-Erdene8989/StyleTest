import { useMemo, useState } from 'react';
import narukaLogo from './assets/naruka-logo.png';
import quizData from './imports/personality_test_MN_v01.json';

type QuizStep = 'intro' | 'questions' | 'results';
type DimensionId = (typeof quizData.dimensions)[number]['id'];
type Answers = Record<string, number>;

const STORAGE_KEY = 'naruka-archetype-quiz-v1';

const archetypes: Record<DimensionId, { name: string; description: string }> = {
  SOC: {
    name: 'Холбогч',
    description: 'Та хүмүүсийн дунд эрч хүч авч, харилцаа холбоог байгалийн жамаар бий болгодог.',
  },
  EXP: {
    name: 'Судлаач',
    description: 'Шинэ санаа, боломж, туршлагыг нээлттэйгээр хүлээн авч, тасралтгүй суралцахыг эрхэмлэдэг.',
  },
  CARE: {
    name: 'Халамжлагч',
    description: 'Та бусдын мэдрэмж, хэрэгцээг анзаарч, ойлголцол ба дэмжлэгийг бий болгодог.',
  },
  ORG: {
    name: 'Зохион байгуулагч',
    description: 'Төлөвлөгөө, тууштай байдал, нарийн нягт ажиллагаа таны найдвартай хүч болдог.',
  },
  CALM: {
    name: 'Тэнцвэржүүлэгч',
    description: 'Дарамттай үед тайван байж, нөхцөл байдлыг тогтуун ухаанаар удирдах чадвартай.',
  },
  GOAL: {
    name: 'Тэмүүлэгч',
    description: 'Тодорхой зорилго тавьж, саадыг даван туулан бодит ахиц гаргах нь таныг хөдөлгөдөг.',
  },
  STYLE: {
    name: 'Бүтээгч',
    description: 'Гоо зүй, өвөрмөц санаа, хувийн илэрхийллээрээ орчиндоо өөрийн өнгийг нэмдэг.',
  },
  ANL: {
    name: 'Мэргэн',
    description: 'Баримтыг нягталж, олон талаас нь шинжилсний дараа үндэслэлтэй шийдвэр гаргадаг.',
  },
  SAFE: {
    name: 'Хамгаалагч',
    description: 'Эрсдэлийг урьдчилан харж, өөртөө болон бусдад найдвартай орчныг бүрдүүлдэг.',
  },
  VOICE: {
    name: 'Өмгөөлөгч',
    description: 'Өөрийн байр суурь, хил хязгаарыг хүндэтгэлтэй бөгөөд тодорхой илэрхийлдэг.',
  },
};

const scaleEntries = Object.entries(quizData.scale).map(([value, label]) => ({
  value: Number(value),
  label,
}));

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-full bg-bordeaux px-6 py-4 font-semibold text-white shadow-lg shadow-bordeaux/15 transition-all hover:-translate-y-0.5 hover:bg-bordeaux-dark hover:shadow-xl"
    >
      <span className="flex items-center justify-center gap-2">
        {children}
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </button>
  );
}

export default function ArchetypeQuiz({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<QuizStep>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').answers || {};
    } catch {
      return {};
    }
  });

  const question = quizData.questions[current];
  const progress =
    step === 'intro'
      ? 0
      : step === 'results'
        ? 100
        : Math.round((current / quizData.questions.length) * 100);

  const results = useMemo(() => {
    return quizData.dimensions
      .map((dimension) => {
        const questions = quizData.questions.filter((item) => item.dimension === dimension.id);
        const total = questions.reduce((sum, item) => {
          const response = answers[item.id] ?? 3;
          return sum + (item.reverse ? 6 - response : response);
        }, 0);
        const score = Math.round(25 * (total / questions.length - 1));
        return {
          ...dimension,
          score,
          archetype: archetypes[dimension.id as DimensionId],
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [answers]);

  function startQuiz() {
    const savedCount = Object.keys(answers).length;
    setCurrent(Math.min(savedCount, quizData.questions.length - 1));
    setStep('questions');
  }

  function answerQuestion(value: number) {
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ answers: nextAnswers, updatedAt: new Date().toISOString() }),
    );

    if (current === quizData.questions.length - 1) {
      window.setTimeout(() => setStep('results'), 220);
    } else {
      window.setTimeout(() => setCurrent((index) => index + 1), 220);
    }
  }

  function goBack() {
    if (step === 'results') {
      setStep('questions');
      setCurrent(quizData.questions.length - 1);
      return;
    }
    setCurrent((index) => Math.max(0, index - 1));
  }

  function restart() {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setCurrent(0);
    setStep('intro');
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-cream">
      <div className="pointer-events-none fixed -left-32 top-24 size-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 bottom-10 size-96 rounded-full bg-bordeaux/10 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-cream-dark bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Тест хаах"
            className="flex size-10 items-center justify-center rounded-full border border-transparent text-xl text-charcoal-soft transition hover:border-cream-dark hover:bg-white"
          >
            ×
          </button>
          <img
            src={narukaLogo}
            alt="Naruka Styling Studio"
            className="h-9 w-auto object-contain brightness-0"
          />
          <button
            type="button"
            onClick={goBack}
            disabled={step === 'intro' || (step === 'questions' && current === 0)}
            className="rounded-full px-3 py-2 text-sm font-semibold text-bordeaux transition hover:bg-blush disabled:invisible"
          >
            Буцах
          </button>
        </div>
        <div className="relative h-1 bg-cream-dark">
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
                Шинэ · Хувийн шинжилгээ
              </p>
              <h2 className="font-display text-3xl leading-tight sm:text-5xl">
                Таны гол архетип юу вэ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                Өөрийн зан төлөв, шийдвэр гаргалт, харилцааны хүчтэй талуудаа таньж,
                давамгай архетипаа тодорхойлоорой.
              </p>
            </div>
            <div className="p-6 sm:p-10">
              <div className="mb-8 grid grid-cols-3 divide-x divide-cream-dark rounded-2xl bg-cream-dark/60 py-5 text-center">
                <div>
                  <p className="font-display text-2xl text-bordeaux">40</p>
                  <p className="mt-1 text-xs text-muted">мэдэгдэл</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-bordeaux">5–8</p>
                  <p className="mt-1 text-xs text-muted">минут</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-bordeaux">10</p>
                  <p className="mt-1 text-xs text-muted">чадвар</p>
                </div>
              </div>
              <p className="mb-6 text-center text-sm leading-relaxed text-muted">
                Зөв, буруу хариулт байхгүй. Сүүлийн үеийн бодит зан үйлдээ тулгуурлан
                хамгийн ойр санагдсан хариултыг сонгоно уу.
              </p>
              <ActionButton onClick={startQuiz}>
                {Object.keys(answers).length ? 'Үргэлжлүүлэх' : 'Тестээ эхлүүлэх'}
              </ActionButton>
            </div>
          </section>
        )}

        {step === 'questions' && (
          <section
            key={question.id}
            className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <p className="rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">
                Архетип тест
              </p>
              <p className="text-xs font-medium text-muted">
                {current + 1} / {quizData.questions.length}
              </p>
            </div>

            <h2 className="min-h-24 font-display text-2xl leading-snug text-charcoal sm:text-3xl">
              {question.text_mn}
            </h2>

            <div className="mt-8 space-y-3">
              {scaleEntries.map((option) => {
                const selected = answers[question.id] === option.value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => answerQuestion(option.value)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-bordeaux bg-bordeaux text-white shadow-md shadow-bordeaux/15'
                        : 'border-cream-dark bg-white text-charcoal hover:-translate-y-0.5 hover:border-gold hover:shadow-md'
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        selected ? 'bg-white text-bordeaux' : 'bg-cream-dark text-bordeaux'
                      }`}
                    >
                      {option.value}
                    </span>
                    <span className="text-sm font-semibold leading-snug sm:text-base">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 'results' && (
          <section className="animate-[fadeIn_.3s_ease-out] rounded-[2rem] border border-white/80 bg-white/60 p-5 shadow-xl shadow-charcoal/5 backdrop-blur-sm sm:p-9">
            <div className="text-center">
              <p className="mx-auto mb-4 w-fit rounded-full bg-blush px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bordeaux">
                Таны давамгай архетип
              </p>
              <h2 className="font-display text-4xl text-charcoal sm:text-5xl">
                {results[0].archetype.name}
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">
                {results[0].archetype.description}
              </p>
            </div>

            <div className="mt-9 rounded-3xl bg-cream-dark/70 p-5 sm:p-7">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-bordeaux">
                    Таны хүчтэй талууд
                  </p>
                  <p className="mt-1 text-sm text-muted">Хамгийн өндөр 5 үзүүлэлт</p>
                </div>
                <p className="text-xs text-muted">0–100</p>
              </div>
              <div className="space-y-5">
                {results.slice(0, 5).map((result, index) => (
                  <div key={result.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-charcoal">
                        {index + 1}. {result.name_mn}
                      </p>
                      <p className="font-display text-lg text-bordeaux">{result.score}</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-bordeaux"
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-cream-dark bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-bordeaux">
                Хослох архетип
              </p>
              <p className="mt-2 font-display text-2xl text-charcoal">
                {results[1].archetype.name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {results[1].archetype.description}
              </p>
            </div>

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
            <p className="mt-5 text-center text-xs leading-relaxed text-muted">
              Энэхүү үр дүн нь өөрийгөө танин мэдэх ерөнхий чиглэл бөгөөд эмнэлзүйн
              оношилгоо биш.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
