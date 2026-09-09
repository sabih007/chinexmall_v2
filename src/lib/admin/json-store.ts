import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A tiny JSON file store: read, and read-modify-write under a lock.
 *
 * Everything the dashboard persists — the catalogue overlay, the coupons —
 * goes through one of these. Writes land in a temp file and are renamed into
 * place, so a crash mid-write cannot truncate the store, and mutations queue
 * behind each other so two operators saving at once cannot overwrite one
 * another.
 *
 * Swapping any of this for a database means reimplementing the store module
 * that calls `createJsonStore`, not its callers.
 */

const DATA_DIR = path.join(process.cwd(), "data");

export interface JsonStore<T> {
  read(): Promise<T>;
  mutate<R>(change: (value: T) => R | Promise<R>): Promise<R>;
}

export function createJsonStore<T>(
  filename: string,
  empty: T,
  /** Coerces whatever is on disk into a usable value; a hand-edited or
   *  half-written file must degrade to `empty`, never crash a page. */
  revive: (parsed: unknown) => T,
): JsonStore<T> {
  const file = path.join(DATA_DIR, filename);
  let queue: Promise<unknown> = Promise.resolve();

  async function read(): Promise<T> {
    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch {
      return empty;
    }
    try {
      return revive(JSON.parse(raw));
    } catch {
      return empty;
    }
  }

  async function write(value: T): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    const temp = `${file}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temp, file);
  }

  function mutate<R>(change: (value: T) => R | Promise<R>): Promise<R> {
    const next = queue.then(async () => {
      const value = await read();
      const result = await change(value);
      await write(value);
      return result;
    });
    // Keep the chain alive even when one mutation rejects.
    queue = next.catch(() => undefined);
    return next;
  }

  return { read, mutate };
}
