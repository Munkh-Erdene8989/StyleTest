import type { AgeBand, TestKind } from "./types";

export function ageBandFromDob(dob: string, now = new Date()): AgeBand {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return "unknown";
  const [year, month, day] = dob.split("-").map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) {
    return "unknown";
  }
  let age = now.getUTCFullYear() - year;
  const monthDelta = now.getUTCMonth() - (month - 1);
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < day)) age -= 1;
  if (age < 0 || age > 120) return "unknown";
  return age >= 18 ? "adult" : "under18";
}

export function canStartTest(kind: TestKind, age: AgeBand) {
  if (age === "unknown") return false;
  if (kind === "fun") return true;
  if (kind === "youth") return age === "under18";
  return age === "adult";
}

export function paidFeaturesAllowed(age: AgeBand) {
  return age === "adult";
}
