import { canStartTest } from "@/domain/age";
import { getVersion, TESTS } from "@/domain/content";
import type { AgeBand, MethodologyVersion } from "@/domain/types";
import { getStore } from "./store";

export async function effectiveVersion(id: string): Promise<MethodologyVersion> {
  const base = getVersion(id);
  const override = await getStore().getVersionOverride(id);
  if (!override) return base;
  return {
    ...base,
    status: override.status,
    translationReview: override.translationReview,
    licenseRef: override.licenseRef,
  };
}

export async function testsForAge(age: AgeBand) {
  const visible = [];
  for (const test of TESTS) {
    const version = await effectiveVersion(test.activeVersionId);
    if (!canStartTest(version.kind, age)) continue;
    visible.push({ test, version });
  }
  return visible;
}
