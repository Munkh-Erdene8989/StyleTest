import { canStartTest } from "@/domain/age";
import { catalogFromLibrary, type CatalogTest } from "@/domain/admin-content";
import { getVersion } from "@/domain/content";
import type { AgeBand, MethodologyVersion } from "@/domain/types";
import { getStore } from "./store";

export async function effectiveVersion(id: string): Promise<MethodologyVersion> {
  const library = await getStore().getAdminLibrary();
  const draft = library.tests.find((item) => item.version.id === id);
  const base = draft ? draft.version : getVersion(id);
  const override = await getStore().getVersionOverride(id);
  if (!override) return base;
  return {
    ...base,
    status: override.status,
    translationReview: override.translationReview,
    licenseRef: override.licenseRef,
  };
}

export async function loadCatalog(): Promise<CatalogTest[]> {
  const library = await getStore().getAdminLibrary();
  const rows = catalogFromLibrary(library);
  const merged: CatalogTest[] = [];
  for (const row of rows) {
    const version = await effectiveVersion(row.version.id);
    merged.push({ ...row, version });
  }
  return merged;
}

export async function testBySlug(slug: string) {
  const rows = await loadCatalog();
  return rows.find((row) => row.test.slug === slug && !row.hidden) ?? null;
}

export async function testsForAge(age: AgeBand) {
  const visible = [];
  for (const row of await loadCatalog()) {
    if (row.hidden) continue;
    if (!canStartTest(row.version.kind, age)) continue;
    visible.push({ test: row.test, version: row.version });
  }
  return visible;
}

export async function publishedNews() {
  const library = await getStore().getAdminLibrary();
  const { NEWS_POSTS } = await import("@/domain/news");
  return library.news ?? NEWS_POSTS;
}
