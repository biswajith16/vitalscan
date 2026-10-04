import { scanRecordSchema, type ScanRecord } from "@/types/scan";
const DB_NAME = "vitalscan-local";
const STORE = "scans";
export interface ScanStorage {
  save(scan: ScanRecord): Promise<void>;
  get(id: string): Promise<ScanRecord | undefined>;
  list(): Promise<ScanRecord[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined")
      return reject(new Error("Local storage is unavailable in this browser."));
    const request = indexedDB.open(DB_NAME, 1);
    let blocked = false;
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onerror = () =>
      reject(
        new Error(
          "Could not open local scan storage. Check browser storage permissions.",
        ),
      );
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Close other VitalScan tabs, then try again."));
    };
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
  });
}
async function transact<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        new Error(
          "Your browser couldn’t save or read scan data. Free up storage and try again.",
        ),
      );
    };
  });
}
export const scanStorage: ScanStorage = {
  async save(record) {
    const validated = scanRecordSchema.parse(record);
    await transact("readwrite", (s) => s.put(validated));
  },
  async get(id) {
    const raw = await transact("readonly", (s) => s.get(id));
    if (raw === undefined) return undefined;
    return scanRecordSchema.parse(raw);
  },
  async list() {
    const records = await transact("readonly", (s) => s.getAll());
    return records
      .map((r) => scanRecordSchema.parse(r))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async delete(id) {
    await transact("readwrite", (s) => s.delete(id));
  },
  async clear() {
    await transact("readwrite", (s) => s.clear());
  },
};
