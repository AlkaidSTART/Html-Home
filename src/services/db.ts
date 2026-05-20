import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import type { Doc } from "../types/doc";

const DB_NAME = "htmlVault";
const STORE_NAME = "docs";
const VERSION = 1;

interface HtmlVaultDB extends DBSchema {
  docs: {
    key: string;
    value: Doc;
    indexes: {
      by_uploadedAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<HtmlVaultDB>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<HtmlVaultDB>(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "uuid",
          });
          store.createIndex("by_uploadedAt", "uploadedAt");
        }
      },
    });
  }
  return dbPromise;
};

export const getAllDocs = async (): Promise<Doc[]> => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const putDoc = async (doc: Doc): Promise<string> => {
  const db = await initDB();
  await db.put(STORE_NAME, doc);
  return doc.uuid;
};

export const deleteDoc = async (uuid: string): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, uuid);
};

export const getDocByUUID = async (uuid: string): Promise<Doc | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, uuid);
};
