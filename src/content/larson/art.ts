import type { LarsonType } from "@/domain/tap";

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

export function silhouette(type: LarsonType, index: number) {
  const tall = type === "Dramatic" || index === 3;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120">
    <rect width="80" height="120" fill="none"/>
    <path d="M40 8 a6 6 0 1 0 0.1 0" fill="none" stroke="#1e1a18" stroke-width="1.2"/>
    <path d="${tall ? "M28 22 H52 L58 108 H22 Z" : "M30 24 H50 L46 70 H34 Z M26 70 H54 L50 108 H30 Z"}" fill="none" stroke="#1e1a18" stroke-width="1.2"/>
  </svg>`;
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
