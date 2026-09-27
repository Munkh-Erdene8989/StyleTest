export type StyleQuizAnswer = {
  value: string | string[] | number;
  label: string;
  insight: string;
};

export type StyleQuizPayLink = { name: string; link: string; logo?: string };

export type StyleQuizRecord = {
  id: string;
  name: string;
  email: string;
  answers: Record<string, StyleQuizAnswer>;
  amount: number;
  currency: "MNT";
  paymentStatus: "invoiced" | "paid";
  qpayInvoiceId?: string;
  qpayPaymentId?: string;
  qrImage?: string;
  urls: StyleQuizPayLink[];
  reportStatus: "pending" | "sending" | "sent" | "failed";
  createdAt: string;
  paidAt?: string;
};
