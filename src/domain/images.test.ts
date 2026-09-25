import { describe, expect, it } from "vitest";
import { isHeic } from "./images";

describe("HEIC detection", () => {
  it("recognizes iPhone photo types and file names", () => {
    expect(isHeic("image/heic", "IMG_1.HEIC")).toBe(true);
    expect(isHeic("image/heif", "photo.heif")).toBe(true);
    expect(isHeic("", "IMG_0001.heic")).toBe(true);
    expect(isHeic("image/jpeg", "photo.jpg")).toBe(false);
    expect(isHeic("image/png", "photo.png")).toBe(false);
  });
});
