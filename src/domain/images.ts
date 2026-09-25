export function isHeic(type: string, name: string) {
  const kind = type.toLowerCase();
  if (kind === "image/heic" || kind === "image/heif" || kind === "image/heic-sequence" || kind === "image/heif-sequence") return true;
  return /\.hei[cf]$/i.test(name);
}

export function imageFormatOk(bytes: Buffer, contentType: string) {
  if (bytes.length < 8) return false;
  if (contentType === "image/png") return bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (contentType === "image/webp") return bytes.subarray(0, 4).toString("ascii") === "RIFF";
  if (contentType === "image/svg+xml") return bytes.subarray(0, 200).toString("utf8").includes("<svg");
  return false;
}

export function extensionFor(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/svg+xml") return "svg";
  return "bin";
}
