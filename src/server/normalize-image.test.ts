import { readFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { imageFormatOk } from "@/domain/images";
import { blankUser } from "./auth";
import { saveQuizPhoto } from "./ai-quiz-service";
import { normalizeUploadedImage } from "./normalize-image";
import { createStyleSession, saveStyleUpload } from "./session-service";
import { getStore, resetStoreForTests } from "./store";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("uploaded images", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("converts any decodable image to jpeg", async () => {
    const samples = {
      png: PNG,
      gif: await sharp(PNG).gif().toBuffer(),
      webp: await sharp(PNG).webp().toBuffer(),
      tiff: await sharp(PNG).tiff().toBuffer(),
      heic: readFileSync(path.join(process.cwd(), "src/server/fixtures/sample.heic")),
    };
    for (const bytes of Object.values(samples)) {
      const image = await normalizeUploadedImage(bytes);
      expect(image.contentType).toBe("image/jpeg");
      expect(imageFormatOk(image.bytes, "image/jpeg")).toBe(true);
    }
  });

  it("rejects a file that is not an image", async () => {
    await expect(normalizeUploadedImage(Buffer.from("not-a-photo.txt"))).rejects.toMatchObject({ code: "invalid_image" });
    await expect(normalizeUploadedImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).rejects.toMatchObject({
      code: "invalid_image",
    });
    await expect(normalizeUploadedImage(Buffer.alloc(8 * 1024 * 1024 + 1))).rejects.toMatchObject({ code: "file_too_large" });
  });

  it("stores a converted jpeg for every quiz photo and the style test", async () => {
    const user = blankUser("user_photo");
    await getStore().saveUser(user);
    const gif = await sharp(PNG).gif().toBuffer();
    const face = await saveQuizPhoto(user, { role: "face", bytes: gif, consent: true });
    const body = await saveQuizPhoto(user, { role: "body", bytes: PNG, consent: true });
    const session = await createStyleSession(user);
    const styleFace = await saveStyleUpload(user, session.id, "face", gif, true);
    const styleBody = await saveStyleUpload(user, session.id, "body", await sharp(PNG).tiff().toBuffer(), true);

    for (const uploadId of [face.id, body.id, styleFace.id, styleBody.id]) {
      const upload = await getStore().getUpload(uploadId);
      expect(upload?.contentType).toBe("image/jpeg");
      const object = await getStore().getObject(upload!.path);
      expect(imageFormatOk(object!.bytes, "image/jpeg")).toBe(true);
    }
  });
});
