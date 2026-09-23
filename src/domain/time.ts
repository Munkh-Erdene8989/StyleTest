export const DAY_MS = 24 * 60 * 60 * 1000;

export function iso(date = new Date()) {
  return date.toISOString();
}

export function plus(ms: number, date = new Date()) {
  return new Date(date.getTime() + ms).toISOString();
}
