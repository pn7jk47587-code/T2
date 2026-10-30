import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lokale Speicherung. Alles liegt in IndexedDB auf dem Gerät, nichts verlässt es.
 * Ein einfacher Schlüssel-Wert-Speicher reicht für das Grundgerüst. Wenn ein Modul
 * später echte Abfragen braucht (Finanzen, Zyklus), bekommt es einen eigenen Object Store.
 * Fällt IndexedDB aus (z. B. in einer Vorschau-Umgebung), arbeitet die App im Arbeitsspeicher weiter.
 */

const DB_NAME = "app-royal";
const STORE = "kv";
const memory = new Map<string, unknown>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return memory.get(key) as T | undefined;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE).objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => resolve(memory.get(key) as T | undefined);
    } catch {
      resolve(memory.get(key) as T | undefined);
    }
  });
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  memory.set(key, value);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function kvAll(): Promise<Record<string, unknown>> {
  const db = await openDb();
  if (!db) return Object.fromEntries(memory);
  return new Promise((resolve) => {
    const out: Record<string, unknown> = {};
    try {
      const req = db.transaction(STORE).objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) {
          out[String(cur.key)] = cur.value;
          cur.continue();
        } else resolve(out);
      };
      req.onerror = () => resolve(out);
    } catch {
      resolve(out);
    }
  });
}

/** State-Hook mit automatischer Speicherung. `ready` ist true, sobald der gespeicherte Wert geladen ist. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    let alive = true;
    kvGet<T>(key).then((v) => {
      if (!alive) return;
      if (v !== undefined) setValue(v);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        void kvSet(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, update, ready, initialRef.current] as const;
}
