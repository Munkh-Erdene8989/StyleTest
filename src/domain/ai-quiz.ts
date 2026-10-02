export type AiQuizKind = "face_beauty" | "body_shape" | "archetype";

export type AiAnswer =
  | { type: "single"; optionId: string }
  | { type: "multiple"; optionIds: string[] }
  | { type: "number"; value: number | null; confirmed: boolean }
  | { type: "group"; fields: Record<string, string | number | boolean | null> };

export type AiQuizSection = { heading: string; body: string };

export type AiQuizBrief = {
  title: string;
  status: "ready" | "insufficient_data" | "tied";
  sections: AiQuizSection[];
};

export type AiQuizDetail = {
  summary: string;
  sections: AiQuizSection[];
};

export type AiQuizPayLink = { name: string; link: string; logo?: string };

export type AiQuizRecord = {
  id: string;
  kind: AiQuizKind;
  ownerUid: string;
  email: string;
  answers: Record<string, AiAnswer>;
  amount: number;
  currency: "MNT";
  paymentStatus: "invoiced" | "paid";
  qpayInvoiceId?: string;
  qpayPaymentId?: string;
  qrImage?: string;
  urls: AiQuizPayLink[];
  brief: AiQuizBrief | null;
  detail: AiQuizDetail | null;
  reportStatus: "pending" | "sending" | "sent" | "failed";
  createdAt: string;
  paidAt?: string;
};

export type PublicAiField = {
  id: string;
  type: "boolean" | "number" | "text" | "textarea";
  label: string;
};

export type PublicAiQuestion = {
  id: string;
  sectionTitle: string;
  text: string;
  help?: string;
  required: boolean;
  type: "single" | "multiple" | "number" | "group";
  unit?: string;
  options?: { id: string; label: string }[];
  fields?: PublicAiField[];
  confirmLabel?: string;
};

export type ScoredQuiz = {
  brief: AiQuizBrief;
  labels: { question: string; answer: string }[];
};
