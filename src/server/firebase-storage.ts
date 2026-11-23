import { getStorage } from "firebase-admin/storage";
import { AppError } from "@/domain/errors";
import { adminApp } from "./firebase-admin";

export function storageObjectName(path: string) {
  if (!path || path.startsWith("/") || path.includes("..") || path.includes("\\")) throw new AppError("invalid_upload", 400);
  return path;
}

export async function saveStoredObject(path: string, bytes: Buffer, contentType: string) {
  await bucket().file(storageObjectName(path)).save(bytes, {
    resumable: false,
    contentType,
    metadata: { contentType },
  });
}

export async function readStoredObject(path: string) {
  const file = bucket().file(storageObjectName(path));
  try {
    const [meta] = await file.getMetadata();
    const [bytes] = await file.download();
    const contentType = typeof meta.contentType === "string" && meta.contentType ? meta.contentType : "application/octet-stream";
    return { bytes, contentType };
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

export async function removeStoredObject(path: string) {
  await bucket().file(storageObjectName(path)).delete({ ignoreNotFound: true });
}

function bucket() {
  const app = adminApp();
  const name = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
  if (!app || !name) throw new AppError("firebase_unconfigured", 500);
  return getStorage(app).bucket(name);
}

function isMissing(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return error.code === 404 || error.code === "404";
}
