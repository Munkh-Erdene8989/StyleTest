import { describe, expect, it } from "vitest";
import { AppError } from "@/domain/errors";
import { storageObjectName, storageUnavailable } from "./firebase-storage";

describe("storage object names", () => {
  it("keeps a private tap path and rejects a path that escapes the bucket", () => {
    expect(storageObjectName("private/user_tap/tap-video/clip.mp4")).toBe("private/user_tap/tap-video/clip.mp4");
    expect(() => storageObjectName("../secret")).toThrow(expect.objectContaining({ code: "invalid_upload" }));
    expect(() => storageObjectName("/etc/passwd")).toThrow(expect.objectContaining({ code: "invalid_upload" }));
  });

  it("treats a missing bucket as storage being unavailable", () => {
    expect(storageUnavailable(new Error("The specified bucket does not exist."))).toBe(true);
    expect(storageUnavailable(new AppError("firebase_unconfigured", 500))).toBe(true);
    expect(storageUnavailable(new Error("network down"))).toBe(false);
  });
});
