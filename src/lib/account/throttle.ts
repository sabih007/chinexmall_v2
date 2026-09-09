import "server-only";

/**
 * A brake on password guessing.
 *
 * In-memory and per process: it stops a script hammering one account on a
 * single instance, and it is deliberately not presented as more than that —
 * a store running behind several instances wants a shared rate limiter (or the
 * platform's) in front of the app as well.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
/** Beyond this many tracked keys the oldest windows are dropped. */
const MAX_KEYS = 5_000;

const failures = new Map<string, { count: number; firstAt: number }>();

function prune(now: number): void {
  for (const [key, entry] of failures) {
    if (now - entry.firstAt > WINDOW_MS) failures.delete(key);
  }
  if (failures.size <= MAX_KEYS) return;
  // Insertion-ordered, so the first keys are the oldest windows.
  for (const key of failures.keys()) {
    failures.delete(key);
    if (failures.size <= MAX_KEYS) break;
  }
}

/** True once an identifier has failed too often inside the window. */
export function isLockedOut(key: string, now = Date.now()): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (now - entry.firstAt > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string, now = Date.now()): void {
  const entry = failures.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    failures.set(key, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
  prune(now);
}

/** Forgets an identifier's failures — called on a successful sign-in. */
export function clearFailures(key: string): void {
  failures.delete(key);
}
