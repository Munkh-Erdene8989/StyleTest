import { quizByKind } from "@/content/quizzes/catalog";
import { ageBandFromDob, ageYears } from "@/domain/age";
import { bodyShapeResult, faceShapeLabel } from "@/domain/ai-quiz-score";
import type { AiQuizRecord } from "@/domain/ai-quiz";
import { AppError } from "@/domain/errors";
import {
  figureFromBodyShape,
  nextFigureState,
  parseBodyFigure,
  parseGender,
  parsePhone,
  yearMonth,
} from "@/domain/profile";
import type { StyleQuizRecord } from "@/domain/style-quiz";
import type { BodyFigure, Gender, User } from "@/domain/types";
import { bodyQuizBank } from "./ai-quiz-banks";
import { attachEmail } from "./auth";
import { getStore } from "./store";

export type ProfileReportItem = {
  id: string;
  title: string;
  label: string;
  at: string;
  pdf: boolean;
};

export type ProfileView = {
  dateOfBirth: string | null;
  age: number | null;
  gender: Gender | null;
  email: string | null;
  phone: string | null;
  bodyShape: string | null;
  faceShape: string | null;
  bodyFigure: BodyFigure | null;
  reports: ProfileReportItem[];
};

export async function loadProfile(user: User): Promise<ProfileView> {
  const quizzes = await quizzesFor(user);
  await persistQuizProfile(user, quizzes);
  const body = newestShape(quizzes);
  const face = newestFace(quizzes);
  const suggested = body ? figureFromBodyShape(body.id) : null;
  const reports = [
    ...quizzes.map(aiReport),
    ...(await styleReports(user)),
    ...(await classicReports(user)),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return {
    dateOfBirth: user.dateOfBirth,
    age: ageYears(user.dateOfBirth),
    gender: user.gender ?? null,
    email: user.email,
    phone: user.phone ?? null,
    bodyShape: body?.label ?? user.bodyShape ?? null,
    faceShape: face ?? user.faceShape ?? null,
    bodyFigure: user.bodyFigureSet ? (user.bodyFigure ?? null) : (suggested ?? user.bodyFigure ?? null),
    reports,
  };
}

export async function rememberQuizProfile(userId: string, quiz: AiQuizRecord) {
  const user = await getStore().getUser(userId);
  if (!user) return userId;
  await persistQuizProfile(user, [quiz, ...(await quizzesFor(user))]);
  return user.id;
}

export async function updateProfile(
  user: User,
  input: { dateOfBirth: string; gender: string; email: string; phone: string; bodyFigure: string },
) {
  const dateOfBirth = parseDob(input.dateOfBirth);
  const gender = readGender(input.gender);
  const phone = readPhone(input.phone);
  const chosen = readFigure(input.bodyFigure);
  const email = input.email.trim().toLowerCase();
  let account = user;
  if (email && email !== (user.email ?? "")) account = await attachEmail(user.id, email);
  const fresh = (await getStore().getUser(account.id)) ?? account;
  const quizzes = await quizzesFor(fresh);
  const body = newestShape(quizzes, "body_shape");
  const suggested = body ? figureFromBodyShape(body.id) : null;
  const figure = nextFigureState(chosen, suggested);
  fresh.dateOfBirth = dateOfBirth;
  fresh.ageBand = dateOfBirth ? ageBandFromDob(dateOfBirth) : "unknown";
  fresh.gender = gender;
  fresh.phone = phone;
  fresh.bodyFigure = figure.bodyFigure;
  fresh.bodyFigureSet = figure.bodyFigureSet;
  await getStore().saveUser(fresh);
  return fresh;
}

async function quizzesFor(user: User) {
  const store = getStore();
  const owned = await store.listAiQuizzesByOwner(user.id);
  const mailed = user.email ? await store.listAiQuizzesByEmail(user.email) : [];
  const map = new Map<string, AiQuizRecord>();
  for (const quiz of [...owned, ...mailed]) map.set(quiz.id, quiz);
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function persistQuizProfile(user: User, quizzes: AiQuizRecord[]) {
  const body = newestShape(quizzes);
  const face = newestFace(quizzes);
  const suggested = body ? figureFromBodyShape(body.id) : null;
  let changed = false;
  if (body && user.bodyShape !== body.label) {
    user.bodyShape = body.label;
    changed = true;
  }
  if (face && user.faceShape !== face) {
    user.faceShape = face;
    changed = true;
  }
  if (suggested && !user.bodyFigureSet && user.bodyFigure !== suggested) {
    user.bodyFigure = suggested;
    changed = true;
  }
  if (changed) await getStore().saveUser(user);
}

function newestShape(quizzes: AiQuizRecord[]) {
  const ordered = [...quizzes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const quiz of ordered) {
    if (quiz.kind !== "body_shape") continue;
    const shape = bodyShapeResult(bodyQuizBank(), quiz.answers);
    if (shape) return shape;
  }
  return null;
}

function newestFace(quizzes: AiQuizRecord[]) {
  const ordered = [...quizzes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const quiz of ordered) {
    if (quiz.kind !== "face_beauty") continue;
    const label = faceShapeLabel(quiz.answers);
    if (label) return label;
  }
  return null;
}

function aiReport(quiz: AiQuizRecord): ProfileReportItem {
  const when = quiz.paidAt ?? quiz.createdAt;
  return {
    id: quiz.id,
    title: quizByKind(quiz.kind)?.title ?? "Тайлан",
    label: yearMonth(when)?.label ?? "",
    at: when,
    pdf: quiz.paymentStatus === "paid",
  };
}

async function styleReports(user: User): Promise<ProfileReportItem[]> {
  const store = getStore();
  const owned = await store.listStyleQuizzesByOwner(user.id);
  const mailed = user.email ? await store.listStyleQuizzesByEmail(user.email) : [];
  const map = new Map<string, StyleQuizRecord>();
  for (const quiz of [...owned, ...mailed]) map.set(quiz.id, quiz);
  return [...map.values()].map((quiz) => styleReport(quiz));
}

function styleReport(quiz: StyleQuizRecord): ProfileReportItem {
  const when = quiz.paidAt ?? quiz.createdAt;
  return {
    id: quiz.id,
    title: "Стайлын зөвлөмж",
    label: yearMonth(when)?.label ?? "",
    at: when,
    pdf: true,
  };
}

async function classicReports(user: User): Promise<ProfileReportItem[]> {
  const reports = await getStore().listReportsByOwner(user.id);
  return reports.map((report) => ({
    id: report.id,
    title: report.summary.title,
    label: yearMonth(report.createdAt)?.label ?? "",
    at: report.createdAt,
    pdf: true,
  }));
}

function parseDob(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  if (ageBandFromDob(value) === "unknown") throw new AppError("invalid_age", 400);
  return value;
}

function readGender(raw: string): Gender | null {
  if (!raw.trim()) return null;
  const gender = parseGender(raw);
  if (!gender) throw new AppError("invalid_gender", 400);
  return gender;
}

function readPhone(raw: string) {
  const phone = parsePhone(raw);
  if (phone === undefined) throw new AppError("invalid_phone", 400);
  return phone;
}

function readFigure(raw: string): BodyFigure | null {
  if (!raw.trim()) return null;
  const figure = parseBodyFigure(raw);
  if (!figure) throw new AppError("invalid_figure", 400);
  return figure;
}
