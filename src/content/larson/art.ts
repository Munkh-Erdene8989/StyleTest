import type { LarsonType, TapBodyShape } from "@/domain/tap";

const JAW: Record<LarsonType, string> = {
  Dramatic: "M70 78 C78 150 122 150 130 78",
  Natural: "M62 84 C74 146 126 146 138 84",
  Romantic: "M64 90 C78 158 122 158 136 90",
  Gamine: "M74 86 L126 86 L120 142 L80 142 Z",
};

export function lineFace(type: LarsonType) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260">
    <rect width="200" height="260" fill="#fff"/>
    <path d="M100 28 C138 28 156 62 156 98 C156 150 132 196 100 208 C68 196 44 150 44 98 C44 62 62 28 100 28 Z" fill="none" stroke="#1e1a18" stroke-width="1.4"/>
    <path d="${JAW[type]}" fill="none" stroke="#1e1a18" stroke-width="1.2" stroke-dasharray="3 3"/>
    <path d="M78 96 H122 M74 108 H126" fill="none" stroke="#1e1a18" stroke-width="1.1"/>
    <path d="M100 112 V148" fill="none" stroke="#1e1a18" stroke-width="1.1"/>
    <path d="M86 164 Q100 174 114 164" fill="none" stroke="#1e1a18" stroke-width="1.2"/>
    <path d="M70 70 Q86 58 100 70 Q114 58 130 70" fill="none" stroke="#1e1a18" stroke-width="1"/>
    <line x1="100" y1="18" x2="100" y2="230" stroke="#1e1a18" stroke-width="0.6" stroke-dasharray="2 3"/>
  </svg>`;
}

export function portrait(type: LarsonType, index: number) {
  const hair = ["#1a1a1a", "#3d342c", "#22181c"][index] ?? "#1a1a1a";
  const lip = type === "Romantic" ? "#a85a62" : type === "Dramatic" ? "#6e2430" : "#8d5a52";
  const shoulder = type === "Natural" ? 78 : 70;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 210">
    <rect width="160" height="210" fill="#f6f1ea"/>
    <path d="M20 210 C30 150 40 128 80 128 C120 128 130 150 140 210 Z" fill="${hair}"/>
    <ellipse cx="80" cy="78" rx="${type === "Gamine" ? 28 : 32}" ry="${type === "Dramatic" ? 42 : 36}" fill="#e6c2a8"/>
    <path d="M48 70 Q80 20 112 70 Q100 48 80 46 Q60 48 48 70 Z" fill="${hair}"/>
    <path d="M62 78 H74 M86 78 H98" stroke="#1e1a18" stroke-width="1.4"/>
    <path d="M74 112 Q80 118 86 112" fill="${lip}"/>
    <path d="M${80 - shoulder} 168 Q80 142 ${80 + shoulder} 168 V210 H${80 - shoulder} Z" fill="${index === 2 ? "#111" : "#2a2422"}"/>
  </svg>`;
}

type LineKind = "column" | "trousers" | "layer" | "jacket" | "dress";

type LineSpec = {
  kind: LineKind;
  shoulder: number;
  waist: number;
  hip: number;
  hem: number;
  curve: number;
};

const LINE_SPECS: Record<string, LineSpec> = {
  "Шулуун": { kind: "column", shoulder: 16, waist: 15, hip: 16, hem: 92, curve: 0 },
  "Геометр": { kind: "jacket", shoulder: 21, waist: 18, hip: 18, hem: 58, curve: 0 },
  "Архитектур": { kind: "jacket", shoulder: 23, waist: 16, hip: 16, hem: 84, curve: 0 },
  "Урт силуэт": { kind: "column", shoulder: 13, waist: 12, hip: 13, hem: 104, curve: 0 },
  "Сул": { kind: "dress", shoulder: 18, waist: 21, hip: 23, hem: 94, curve: 7 },
  "Өргөн шулуун": { kind: "trousers", shoulder: 18, waist: 17, hip: 23, hem: 100, curve: 0 },
  "Давхарга": { kind: "layer", shoulder: 20, waist: 18, hip: 21, hem: 98, curve: 2 },
  "Дунд урт": { kind: "dress", shoulder: 16, waist: 15, hip: 20, hem: 78, curve: 5 },
  "Муруй": { kind: "dress", shoulder: 16, waist: 12, hip: 22, hem: 94, curve: 11 },
  "Бүсэлхийтэй": { kind: "dress", shoulder: 16, waist: 10, hip: 21, hem: 96, curve: 9 },
  "Урсгал": { kind: "dress", shoulder: 15, waist: 14, hip: 25, hem: 102, curve: 12 },
  "Богино": { kind: "jacket", shoulder: 16, waist: 14, hip: 15, hem: 42, curve: 0 },
  "Тасалсан": { kind: "jacket", shoulder: 15, waist: 14, hip: 16, hem: 36, curve: 0 },
  "Жижиг": { kind: "jacket", shoulder: 12, waist: 11, hip: 12, hem: 40, curve: 2 },
};

function lineSpec(label: string, body?: TapBodyShape | null, type?: LarsonType): LineSpec {
  const base = { ...(LINE_SPECS[label] ?? LINE_SPECS["Шулуун"]) };
  if (type === "Gamine" && label === "Шулуун") base.hem = 52;
  if (body === "hourglass") base.waist = Math.max(8, base.waist - 4);
  else if (body === "pear") {
    base.hip += 5;
    base.shoulder = Math.max(11, base.shoulder - 2);
  } else if (body === "apple") base.waist += 4;
  else if (body === "rectangle") base.waist = Math.round((base.shoulder + base.hip) / 2);
  else if (body === "inverted_triangle") {
    base.shoulder += 4;
    base.hip = Math.max(11, base.hip - 3);
  }
  return base;
}

function outline(spec: LineSpec) {
  const top = 22;
  const hemY = Math.min(116, top + spec.hem);
  const waistY = top + (hemY - top) * 0.4;
  const hipY = top + (hemY - top) * 0.62;
  const bend = spec.curve;
  const left = (at: number) => 40 - at;
  const right = (at: number) => 40 + at;
  return [
    `M ${left(spec.shoulder)} ${top}`,
    `Q ${left(spec.waist) - bend} ${waistY} ${left(spec.waist)} ${waistY}`,
    `Q ${left(spec.hip) - bend} ${hipY} ${left(spec.hip)} ${hipY}`,
    `L ${left(spec.hip)} ${hemY}`,
    `L ${right(spec.hip)} ${hemY}`,
    `L ${right(spec.hip)} ${hipY}`,
    `Q ${right(spec.hip) + bend} ${hipY} ${right(spec.waist)} ${waistY}`,
    `Q ${right(spec.waist) + bend} ${waistY} ${right(spec.shoulder)} ${top}`,
    "Z",
  ].join(" ");
}

function trousers(spec: LineSpec) {
  const top = 22;
  const hipY = 58;
  const hemY = Math.min(116, top + spec.hem);
  const hip = spec.hip;
  return [
    `M ${40 - spec.shoulder} ${top}`,
    `L ${40 - spec.waist} ${hipY - 10}`,
    `L ${40 - hip} ${hipY}`,
    `L ${40 - hip + 1} ${hemY}`,
    `L ${37} ${hemY}`,
    `L ${37} ${hipY + 8}`,
    `L ${43} ${hipY + 8}`,
    `L ${43} ${hemY}`,
    `L ${40 + hip - 1} ${hemY}`,
    `L ${40 + hip} ${hipY}`,
    `L ${40 + spec.waist} ${hipY - 10}`,
    `L ${40 + spec.shoulder} ${top}`,
    "Z",
  ].join(" ");
}

function layer(spec: LineSpec) {
  const inner = outline({ ...spec, shoulder: spec.shoulder - 5, waist: spec.waist - 4, hip: spec.hip - 5, hem: spec.hem - 14, curve: 0 });
  const top = 22;
  const hemY = Math.min(116, top + spec.hem);
  const outer = [
    `M ${40 - spec.shoulder - 3} ${top} L ${40 - spec.hip - 2} ${hemY}`,
    `M ${40 + spec.shoulder + 3} ${top} L ${40 + spec.hip + 2} ${hemY}`,
    `M ${40 - spec.shoulder - 3} ${top} L ${40 - 8} ${top + 16}`,
    `M ${40 + spec.shoulder + 3} ${top} L ${40 + 8} ${top + 16}`,
  ].join(" ");
  return `${inner} ${outer}`;
}

function garment(spec: LineSpec) {
  if (spec.kind === "trousers") return trousers(spec);
  if (spec.kind === "layer") return layer(spec);
  return outline(spec);
}

export function silhouette(label: string, body?: TapBodyShape | null, type?: LarsonType) {
  const spec = lineSpec(label, body, type);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 124"><circle cx="40" cy="12" r="5.5" fill="none" stroke="#1e1a18" stroke-width="1.3"/><path d="M40 17.5 V22" fill="none" stroke="#1e1a18" stroke-width="1.2"/><path d="${garment(spec)}" fill="none" stroke="#1e1a18" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

export function outfit(type: LarsonType, index: number) {
  const fill = type === "Romantic" ? "#7f4e50" : type === "Natural" ? "#6d735d" : type === "Gamine" ? "#1d2525" : "#161616";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 220">
    <rect width="140" height="220" fill="#f7f3ee"/>
    <circle cx="70" cy="28" r="12" fill="#e6c2a8"/>
    <path d="M${index ? 48 : 40} 48 H${index ? 92 : 100} L${index ? 98 : 108} 200 H${index ? 42 : 32} Z" fill="${fill}"/>
    <path d="M70 48 V200" stroke="#f4f1ec" stroke-width="${index ? 1 : 3}"/>
  </svg>`;
}

export function detailStill(hex: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
    <rect width="120" height="80" fill="#f6f1ea"/>
    <circle cx="36" cy="40" r="16" fill="${hex}"/>
    <rect x="64" y="24" width="36" height="32" rx="4" fill="none" stroke="#1e1a18"/>
  </svg>`;
}

export function jewelryStill() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 70">
    <rect width="160" height="70" fill="#f6f1ea"/>
    <circle cx="36" cy="36" r="14" fill="none" stroke="#8a7a62" stroke-width="3"/>
    <path d="M70 22 H120 L112 48 H78 Z" fill="none" stroke="#8a7a62" stroke-width="2"/>
  </svg>`;
}
