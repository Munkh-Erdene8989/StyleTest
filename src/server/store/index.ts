import type { AppStore } from "./types";
import { MemoryStore } from "./memory";
import { FirestoreStore } from "./firestore";

const globalStore = globalThis as unknown as { __styleaiStore?: AppStore };

export function getStore(): AppStore {
  if (globalStore.__styleaiStore) return globalStore.__styleaiStore;
  const driver = process.env.DATA_DRIVER;
  const hasAdmin = Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  if (driver === "firestore" || (driver !== "memory" && hasAdmin)) {
    globalStore.__styleaiStore = new FirestoreStore();
  } else {
    globalStore.__styleaiStore = new MemoryStore();
  }
  return globalStore.__styleaiStore;
}

export function resetStoreForTests() {
  globalStore.__styleaiStore = new MemoryStore();
  return globalStore.__styleaiStore;
}
