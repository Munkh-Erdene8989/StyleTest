export const TAP_PRICE_MNT = 500;

export const TAP_BODY_SHAPES = [
  { id: "hourglass", label: "Элсэн цаг" },
  { id: "pear", label: "Лийр" },
  { id: "apple", label: "Алим" },
  { id: "rectangle", label: "Тэгш өнцөгт" },
  { id: "inverted_triangle", label: "Урвуу гурвалжин" },
] as const;

export type TapBodyShape = (typeof TAP_BODY_SHAPES)[number]["id"];

export function tapBodyShape(value: unknown): TapBodyShape | null {
  const id = typeof value === "string" ? value : "";
  return TAP_BODY_SHAPES.some((shape) => shape.id === id) ? (id as TapBodyShape) : null;
}

export function tapBodyLabel(id: string) {
  return TAP_BODY_SHAPES.find((shape) => shape.id === id)?.label ?? "";
}

export const LARSON_TYPES = ["Dramatic", "Natural", "Romantic", "Gamine"] as const;

export type LarsonType = (typeof LARSON_TYPES)[number];

export type CropBox = { x: number; y: number; w: number; h: number };

export type LarsonTraits = {
  face: string;
  brows: string;
  eyes: string;
  nose: string;
  lips: string;
  chin: string;
};

export type LarsonReading = {
  type: LarsonType;
  traits: LarsonTraits;
  summary: string;
  crops: {
    brows: CropBox;
    eyes: CropBox;
    nose: CropBox;
    lips: CropBox;
    chin: CropBox;
  };
};

export type TapRetake = {
  target: "photo" | "video" | "both";
  instructions: string[];
};

export type TapPayLink = { name: string; link: string; logo?: string };

export type TapRecord = {
  id: string;
  ownerUid: string;
  email: string;
  amount: number;
  currency: "MNT";
  paymentStatus: "invoiced" | "paid";
  qpayInvoiceId?: string;
  qpayPaymentId?: string;
  qrImage?: string;
  urls: TapPayLink[];
  photoUploadId: string;
  frameUploadIds: string[];
  videoPath: string;
  bodyShape: TapBodyShape;
  reportStatus: "pending" | "sending" | "sent" | "failed";
  reportStartedAt?: string;
  reading: LarsonReading | null;
  retake: TapRetake | null;
  createdAt: string;
  paidAt?: string;
};

const TRAIT_KEYS = ["face", "brows", "eyes", "nose", "lips", "chin"] as const;
const CROP_KEYS = ["brows", "eyes", "nose", "lips", "chin"] as const;

export function checkLarsonVerdict(value: unknown): { status: "ready"; reading: LarsonReading } | { status: "retake"; retake: TapRetake } | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (row.status === "retake") {
    const target = row.retakeTarget;
    const instructions = stringList(row.instructions);
    if (target !== "photo" && target !== "video" && target !== "both") return null;
    if (!instructions.length) return null;
    return { status: "retake", retake: { target, instructions } };
  }
  if (row.status !== "ready") return null;
  if (!LARSON_TYPES.includes(row.type as LarsonType)) return null;
  const traits = traitBlock(row.traits);
  const crops = cropBlock(row.crops);
  const summary = cleanText(row.summary);
  if (!traits || !crops || !summary) return null;
  return { status: "ready", reading: { type: row.type as LarsonType, traits, summary, crops } };
}

function traitBlock(value: unknown): LarsonTraits | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const traits = {} as LarsonTraits;
  for (const key of TRAIT_KEYS) {
    const text = cleanText(row[key]);
    if (!text) return null;
    traits[key] = text;
  }
  return traits;
}

function cropBlock(value: unknown): LarsonReading["crops"] | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const crops = {} as LarsonReading["crops"];
  for (const key of CROP_KEYS) {
    const box = cropBox(row[key]);
    if (!box) return null;
    crops[key] = box;
  }
  return crops;
}

function cropBox(value: unknown): CropBox | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const x = unit(row.x);
  const y = unit(row.y);
  const w = unit(row.w);
  const h = unit(row.h);
  if (x === null || y === null || w === null || h === null) return null;
  if (w < 0.04 || h < 0.04 || x + w > 1.02 || y + h > 1.02) return null;
  return { x, y, w, h };
}

function unit(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return value;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanText).filter(Boolean).slice(0, 6);
}
