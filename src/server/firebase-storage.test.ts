import { describe, expect, it } from "vitest";
import { storageObjectName } from "./firebase-storage";

describe("storage object names", () => {
  it("keeps a private tap path and rejects a path that escapes the bucket", () => {
    expect(storageObjectName("private/user_tap/tap-video/clip.mp4")).toBe("private/user_tap/tap-video/clip.mp4");
    expect(() => storageObjectName("../secret")).toThrow(expect.objectContaining({ code: "invalid_upload" }));
    expect(() => storageObjectName("/etc/passwd")).toThrow(expect.objectContaining({ code: "invalid_upload" }));
  });
});
