import { contrastNames, essenceNames, faceNames, faceQuestions } from "@/content/quizzes/face-beauty";
import type { AiAnswer, AiQuizKind, AiQuizSection, ScoredQuiz } from "@/domain/ai-quiz";

export type ArchetypeBank = {
  dimensions: { id: string; label?: string }[];
  questions: { id: string; text?: string; dimension: string; reverse?: boolean }[];
  scale?: Record<string, string>;
};

const ARCHETYPE_COPY: Record<string, { name: string; description: string }> = {
  SOC: {
    name: "Холбогч",
    description: "Та хүмүүсийн дунд эрч хүч авч, харилцаа холбоог байгалийн жамаар бий болгодог.",
  },
  EXP: {
    name: "Судлаач",
    description: "Шинэ санаа, боломж, туршлагыг нээлттэйгээр хүлээн авч, тасралтгүй суралцахыг эрхэмлэдэг.",
  },
  CARE: {
    name: "Халамжлагч",
    description: "Та бусдын мэдрэмж, хэрэгцээг анзаарч, ойлголцол ба дэмжлэгийг бий болгодог.",
  },
  ORG: {
    name: "Зохион байгуулагч",
    description: "Төлөвлөгөө, тууштай байдал, нарийн нягт ажиллагаа таны найдвартай хүч болдог.",
  },
  CALM: {
    name: "Тэнцвэржүүлэгч",
    description: "Дарамттай үед тайван байж, нөхцөл байдлыг тогтуун ухаанаар удирдах чадвартай.",
  },
  GOAL: {
    name: "Тэмүүлэгч",
    description: "Тодорхой зорилго тавьж, саадыг даван туулан бодит ахиц гаргах нь таныг хөдөлгөдөг.",
  },
  STYLE: {
    name: "Бүтээгч",
    description: "Гоо зүй, өвөрмөц санаа, хувийн илэрхийллээрээ орчиндоо өөрийн өнгийг нэмдэг.",
  },
  ANL: {
    name: "Мэргэн",
    description: "Баримтыг нягталж, олон талаас нь шинжилсний дараа үндэслэлтэй шийдвэр гаргадаг.",
  },
  SAFE: {
    name: "Хамгаалагч",
    description: "Эрсдэлийг урьдчилан харж, өөртөө болон бусдад найдвартай орчныг бүрдүүлдэг.",
  },
  VOICE: {
    name: "Өмгөөлөгч",
    description: "Өөрийн байр суурь, хил хязгаарыг хүндэтгэлтэй бөгөөд тодорхой илэрхийлдэг.",
  },
};

const seasonNames: Record<string, string> = {
  spring: "Дулаан хавар",
  summer: "Зөөлөн зун",
  autumn: "Дулаан намар",
  winter: "Гүн өвөл",
};

const attributeNames: Record<string, string> = {
  warm: "Дулаан",
  cool: "Хүйтэн",
  neutral: "Төвийг сахисан",
  light: "Цайвар",
  medium: "Дунд",
  deep: "Гүн",
  soft: "Зөөлөн",
  bright: "Тод",
};

type BodyOption = { id: string; label: string; feature_value?: string | null };
type BodyField = { id: string; type: string; label?: string };
type BodyQuestion = {
  id: string;
  title: string;
  section_id?: string;
  type: string;
  required?: boolean;
  help?: string;
  unit?: string;
  allow_skip?: boolean;
  options?: BodyOption[];
  fields?: BodyField[];
  quality_confirmation?: { label?: string };
};
type BodyRule = {
  result: string;
  all: { feature: string; operator: string; value: string | string[] }[];
};
export type BodyBank = {
  test: { title: string; description: string; disclaimer: string };
  sections: { id: string; title: string }[];
  questions: BodyQuestion[];
  scoring: {
    questionnaire_sufficiency: { minimum_known_shape_answers: number };
    classification_rules: { rules: BodyRule[] };
  };
  result_types: { id: string; label: string; description: string; starter_recommendations: string[] }[];
  recommendations: { principle: string };
};

export function pickWinner(rows: [string, number][]): { winner: string | null; tied: string[] } {
  if (!rows.length) return { winner: null, tied: [] };
  const top = rows[0][1];
  const tied = rows.filter((row) => row[1] === top).map((row) => row[0]);
  if (tied.length > 1) return { winner: null, tied };
  return { winner: tied[0] ?? null, tied: [] };
}

export function scoreFace(answers: Record<string, AiAnswer>): ScoredQuiz {
  const chosen = singleMap(answers);
  const missing = faceQuestions.filter((question) => !faceQuestions.find((item) => item.id === question.id)?.options.some((option) => option.id === chosen[question.id]));
  const labels = faceLabels(chosen);
  if (missing.length) {
    return {
      brief: {
        title: "Нүүр ба гоо сайхан",
        status: "insufficient_data",
        sections: [
          {
            heading: "Ангилал гараагүй",
            body: `Бүх асуулт бөглөгдөөгүй тул нүүрний хэлбэр, өнгө, контрастыг батлаагүй. Дутуу: ${missing.map((question) => question.id).join(", ")}.`,
          },
        ],
      },
      labels,
    };
  }
  const faceRows = scorePrefix(chosen, "fs_");
  const contrastRows = scorePrefix(chosen, "fc_");
  const essenceRows = scorePrefix(chosen, "ke_");
  const face = pickWinner(faceRows);
  const contrast = pickWinner(contrastRows);
  const attributes = attributeVotes(chosen);
  const sections: AiQuizSection[] = [
    faceSection(face, faceRows),
    colorSection(attributes),
    contrastSection(contrast),
    essenceSection(essenceRows),
    featureSection(chosen),
  ];
  const tied = Boolean(face.tied.length || contrast.tied.length || attributes.season.tied.length || attributes.undertone.tied.length);
  const ready = Boolean(face.winner && contrast.winner);
  return {
    brief: {
      title: "Нүүр ба гоо сайхан",
      status: tied && !ready ? "tied" : ready ? "ready" : "insufficient_data",
      sections,
    },
    labels,
  };
}

export function scoreBody(bank: BodyBank, answers: Record<string, AiAnswer>): ScoredQuiz {
  const featureValue = (questionId: string) => {
    const item = bank.questions.find((question) => question.id === questionId);
    const answer = answers[questionId];
    if (!item || answer?.type !== "single") return null;
    return item.options?.find((option) => option.id === answer.optionId)?.feature_value ?? null;
  };
  const relationValues = ["q01", "q02", "q05"].map(featureValue).filter((value): value is string => Boolean(value));
  const relationCounts = relationValues.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
  const sortedRelations = Object.entries(relationCounts).sort((a, b) => b[1] - a[1]);
  let upperLower: string | null = null;
  if (relationValues.length >= 2 && sortedRelations[0]) {
    upperLower = sortedRelations[1]?.[1] === sortedRelations[0][1] ? "conflicting" : sortedRelations[0][0];
  }
  const waistValues = ["q03", "q06"].map(featureValue).filter((value): value is string => Boolean(value));
  const waist =
    waistValues.length === 0 ? null : waistValues.every((value) => value === waistValues[0]) ? waistValues[0] : "conflicting";
  const features: Record<string, string | null> = {
    upper_lower_relation: upperLower,
    waist_definition: waist,
    midsection: featureValue("q04"),
  };
  const known = ["q01", "q02", "q03", "q04", "q05", "q06"].map(featureValue).filter(Boolean).length;
  const minimum = bank.scoring.questionnaire_sufficiency.minimum_known_shape_answers;
  const conflicting = Object.values(features).includes("conflicting");
  const matched =
    !conflicting && known >= minimum
      ? bank.scoring.classification_rules.rules.find((rule) =>
          rule.all.every((condition) => {
            const value = features[condition.feature];
            if (!value || value === "conflicting") return false;
            return condition.operator === "eq"
              ? value === condition.value
              : Array.isArray(condition.value) && condition.value.includes(value);
          }),
        )
      : undefined;
  const shape = bank.result_types.find((item) => item.id === matched?.result);
  const labels = bodyLabels(bank, answers);
  const sections: AiQuizSection[] = [];
  if (!shape) {
    sections.push({
      heading: "Ангилал гараагүй",
      body: conflicting
        ? "Харьцуулсан хариултууд зөрчилдсөн тул нэг хэлбэр оноогоогүй."
        : known < minimum
          ? `Хэлбэр тогтооход хамгийн багадаа ${minimum} мэдэгдэх хариу хэрэгтэй. Одоо ${known}. «Мэдэхгүй» хариултыг мэдэгдэх гэж тоолоогүй.`
          : "Дүрэмд таарах хэлбэр гараагүй тул нэг ангилал оноогоогүй.",
    });
  } else {
    sections.push({
      heading: shape.label,
      body: `${shape.description} ${shape.starter_recommendations.join(" ")}`,
    });
  }
  sections.push({ heading: "Хувцасны зарчим", body: bank.recommendations.principle });
  sections.push({ heading: "Хязгаар", body: bank.test.disclaimer });
  return {
    brief: {
      title: "Биеийн хэлбэр ба хувцаслалт",
      status: shape ? "ready" : conflicting ? "tied" : "insufficient_data",
      sections,
    },
    labels,
  };
}

export function scoreArchetype(bank: ArchetypeBank, answers: Record<string, AiAnswer>): ScoredQuiz {
  const missing = bank.questions.filter((question) => scaleValue(answers[question.id]) === null);
  const labels = bank.questions.flatMap((question) => {
    const value = scaleValue(answers[question.id]);
    if (value === null) return [];
    return [{ question: question.text || question.id, answer: String(value) }];
  });
  if (missing.length || bank.questions.length === 0) {
    return {
      brief: {
        title: "Өөрийгөө таних ба хувийн стиль",
        status: "insufficient_data",
        sections: [
          {
            heading: "Оноо гараагүй",
            body: "Бүх асуулт бөглөгдсөн үед л хэмжээс бүрийн оноог гаргана. Алгассан хариуг дундаж гэж тооцохгүй.",
          },
        ],
      },
      labels,
    };
  }
  const dimensions = bank.dimensions
    .map((dimension) => {
      const questions = bank.questions.filter((question) => question.dimension === dimension.id);
      if (!questions.length) return null;
      const total = questions.reduce((sum, question) => {
        const value = scaleValue(answers[question.id]) ?? 0;
        return sum + (question.reverse ? 6 - value : value);
      }, 0);
      const score = Math.round(25 * (total / questions.length - 1));
      const copy = ARCHETYPE_COPY[dimension.id];
      return {
        id: dimension.id,
        name: copy?.name || dimension.label || dimension.id,
        description: copy?.description || "",
        score,
      };
    })
    .filter((item): item is { id: string; name: string; description: string; score: number } => Boolean(item))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const top = dimensions[0];
  const tied = top ? dimensions.filter((item) => item.score === top.score) : [];
  const primary = tied.length === 1 ? top : null;
  const lines = dimensions.map((item) => `${item.name}: ${item.score}`);
  const sections: AiQuizSection[] = [
    { heading: "Хэмжээсүүд", body: lines.join(". ") + "." },
  ];
  if (primary) {
    sections.unshift({
      heading: primary.name,
      body: primary.description || "Энэ хэмжээс хамгийн өндөр оноотой.",
    });
  } else if (tied.length > 1) {
    sections.unshift({
      heading: "Тэнцсэн хэмжээс",
      body: `${tied.map((item) => item.name).join(", ")} ижил оноотой тул нэгийг нь гол гэж сонгоогүй.`,
    });
  }
  return {
    brief: {
      title: "Өөрийгөө таних ба хувийн стиль",
      status: primary ? "ready" : tied.length > 1 ? "tied" : "insufficient_data",
      sections,
    },
    labels,
  };
}

export function scoreAiQuiz(
  kind: AiQuizKind,
  answers: Record<string, AiAnswer>,
  banks: { body: BodyBank; archetype: ArchetypeBank | null },
): ScoredQuiz {
  if (kind === "face_beauty") return scoreFace(answers);
  if (kind === "body_shape") return scoreBody(banks.body, answers);
  if (!banks.archetype) {
    return {
      brief: {
        title: "Өөрийгөө таних ба хувийн стиль",
        status: "insufficient_data",
        sections: [{ heading: "Асуулт хүлээгдэж байна", body: "Архетипийн асуултын файл ороогүй тул оноо гаргаагүй." }],
      },
      labels: [],
    };
  }
  return scoreArchetype(banks.archetype, answers);
}

function singleMap(answers: Record<string, AiAnswer>) {
  const chosen: Record<string, string> = {};
  for (const [id, answer] of Object.entries(answers)) {
    if (answer?.type === "single" && answer.optionId) chosen[id] = answer.optionId;
  }
  return chosen;
}

function scorePrefix(chosen: Record<string, string>, prefix: string): [string, number][] {
  const totals: Record<string, number> = {};
  for (const question of faceQuestions) {
    if (!question.id.startsWith(prefix)) continue;
    const option = question.options.find((item) => item.id === chosen[question.id]);
    for (const [key, value] of Object.entries(option?.scores ?? {})) {
      totals[key] = (totals[key] || 0) + value;
    }
  }
  return Object.entries(totals)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function attributeVotes(chosen: Record<string, string>) {
  const votes: Record<string, Record<string, number>> = {};
  for (const question of faceQuestions) {
    if (!question.id.startsWith("pc_")) continue;
    const option = question.options.find((item) => item.id === chosen[question.id]);
    for (const [type, value] of Object.entries(option?.attributes ?? {})) {
      votes[type] ??= {};
      votes[type][value] = (votes[type][value] || 0) + 1;
    }
  }
  const ranked = (type: string) =>
    Object.entries(votes[type] ?? {})
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const seasonVote = pickWinner(ranked("season_family"));
  const undertone = pickWinner(ranked("undertone"));
  const value = pickWinner(ranked("value"));
  const chroma = pickWinner(ranked("chroma"));
  let season = seasonVote.winner;
  if (!season && !seasonVote.tied.length && undertone.winner && !undertone.tied.length) {
    season = undertone.winner.includes("warm")
      ? value.winner === "deep"
        ? "autumn"
        : "spring"
      : value.winner === "deep" || chroma.winner === "bright"
        ? "winter"
        : "summer";
  }
  return { season: { winner: season, tied: seasonVote.tied }, undertone, value, chroma };
}

function faceSection(face: { winner: string | null; tied: string[] }, rows: [string, number][]): AiQuizSection {
  if (face.tied.length) {
    return { heading: "Нүүрний хэлбэр", body: `Тэнцсэн: ${face.tied.map(labelOf).join(", ")}. Нэгийг нь сонгоогүй.` };
  }
  if (!face.winner) return { heading: "Нүүрний хэлбэр", body: "Нүүрний хэлбэрийн оноо хүрэлцэхгүй тул ангилаагүй." };
  const second = rows.find((row) => row[0] !== face.winner);
  const extra = second ? ` Хоёрдогч хэлбэр: ${labelOf(second[0])}.` : "";
  return {
    heading: "Нүүрний хэлбэр",
    body: `${labelOf(face.winner)}.${extra} Нүүр орчимд зөөлөн баланс, зөв өргөн үүсгэх шугам тохирно.`,
  };
}

function colorSection(attributes: ReturnType<typeof attributeVotes>): AiQuizSection {
  const season = attributes.season.tied.length
    ? `Улирал тэнцсэн: ${attributes.season.tied.map((item) => seasonNames[item] || item).join(", ")}.`
    : attributes.season.winner
      ? `Өнгөний улирал: ${seasonNames[attributes.season.winner] || attributes.season.winner}.`
      : "Өнгөний улирлыг батлаагүй.";
  const parts = [
    named("Доод өнгө", attributes.undertone),
    named("Value", attributes.value),
    named("Chroma", attributes.chroma),
  ].filter(Boolean);
  return { heading: "Өнгө", body: [season, ...parts].join(" ") };
}

function contrastSection(contrast: { winner: string | null; tied: string[] }): AiQuizSection {
  if (contrast.tied.length) {
    return { heading: "Контраст", body: `Тэнцсэн: ${contrast.tied.map((item) => contrastNames[item] || item).join(", ")}. Нэгийг нь сонгоогүй.` };
  }
  if (!contrast.winner) return { heading: "Контраст", body: "Контрастын оноо хүрэлцэхгүй тул ангилаагүй." };
  const note =
    contrast.winner === "high"
      ? "Тод өнгө, цэвэр хар-цагаан болон jewel tone танд сайн ажиллана."
      : contrast.winner === "low"
        ? "Зөөлөн, ойролцоо өнгийн tonal хослол нүүрийг илүү гэрэлтүүлнэ."
        : "Дунд зэргийн контраст, нэг төвлөрсөн акцент хамгийн тэнцвэртэй.";
  return { heading: "Контраст", body: `${contrastNames[contrast.winner] || contrast.winner}. ${note}` };
}

function essenceSection(rows: [string, number][]): AiQuizSection {
  if (!rows.length) return { heading: "Essence", body: "Essence-ийн оноо хүрэлцэхгүй." };
  const third = rows[2]?.[1];
  const shown = third === undefined ? rows : rows.filter((row) => row[1] >= third);
  const total = rows.reduce((sum, [, score]) => sum + score, 0) || 1;
  const lines = shown.map(([key, score]) => `${essenceNames[key] || key} ${Math.round((score / total) * 100)}%`);
  const tieNote = shown.length > 3 ? " Тэнцсэн essence-үүдийг хамтад нь үлдээсэн." : "";
  return { heading: "Essence", body: `${lines.join(", ")}. Хувь нь бүх essence онооны нийлбэрт харьцуулсан бөгөөд 100 болгож хуваагаагүй.${tieNote}` };
}

function featureSection(chosen: Record<string, string>): AiQuizSection {
  const lines = faceQuestions
    .filter((question) => question.id.startsWith("ff_"))
    .map((question) => {
      const option = question.options.find((item) => item.id === chosen[question.id]);
      return option ? `${question.text} ${option.label}` : "";
    })
    .filter(Boolean);
  return { heading: "Нүүрний хэсгүүд", body: lines.join(". ") + "." };
}

function faceLabels(chosen: Record<string, string>) {
  return faceQuestions.flatMap((question) => {
    const option = question.options.find((item) => item.id === chosen[question.id]);
    if (!option) return [];
    return [{ question: question.text, answer: option.label }];
  });
}

function bodyLabels(bank: BodyBank, answers: Record<string, AiAnswer>) {
  return bank.questions.flatMap((question) => {
    const answer = answers[question.id];
    if (!answer) return [];
    if (answer.type === "single") {
      const label = question.options?.find((option) => option.id === answer.optionId)?.label;
      return label ? [{ question: question.title, answer: label }] : [];
    }
    if (answer.type === "multiple") {
      const labels = answer.optionIds
        .map((id) => question.options?.find((option) => option.id === id)?.label)
        .filter((label): label is string => Boolean(label));
      return labels.length ? [{ question: question.title, answer: labels.join(", ") }] : [];
    }
    if (answer.type === "number") {
      if (answer.value === null) return [];
      return [{ question: question.title, answer: `${answer.value}${question.unit ? ` ${question.unit}` : ""}` }];
    }
    const fields = Object.entries(answer.fields)
      .map(([id, value]) => {
        if (value === null || value === "") return "";
        const label = question.fields?.find((field) => field.id === id)?.label || id;
        return `${label}: ${String(value)}`;
      })
      .filter(Boolean);
    return fields.length ? [{ question: question.title, answer: fields.join("; ") }] : [];
  });
}

function scaleValue(answer: AiAnswer | undefined) {
  if (answer?.type !== "single") return null;
  const value = Number(answer.optionId);
  if (!Number.isInteger(value) || value < 1 || value > 5) return null;
  return value;
}

function labelOf(key: string) {
  return faceNames[key] || key;
}

function named(title: string, pick: { winner: string | null; tied: string[] }) {
  if (pick.tied.length) return `${title} тэнцсэн: ${pick.tied.map((item) => attributeNames[item] || item).join(", ")}.`;
  if (!pick.winner) return "";
  return `${title}: ${attributeNames[pick.winner] || pick.winner}.`;
}
