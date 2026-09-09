/**
 * Admin session tokens.
 *
 * Deliberately dependency-free and built on Web Crypto so the same module runs
 * in `proxy.ts` (the optimistic redirect) and in Server Actions (the real
 * check). There is one operator account: the password in `ADMIN_PASSWORD`.
 */

export const ADMIN_COOKIE = "cx_admin";

/** How long a signed-in operator stays signed in. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function adminPassword(): string | undefined {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value ? value : undefined;
}

/** False until `ADMIN_PASSWORD` is set — the login page says so rather than
 *  silently rejecting every attempt. */
export function isAdminConfigured(): boolean {
  return adminPassword() !== undefined;
}

/** Signing key. Falls back to the password so a single env var is enough. */
function signingKey(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || adminPassword() || "";
}

const bytes = (value: string) => new TextEncoder().encode(value);

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(payload: string, key: string): Promise<string> {
  const imported = await crypto.subtle.importKey(
    "raw",
    bytes(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", imported, bytes(payload)));
}

/**
 * Constant-time comparison. Both sides are hashed first so the comparison
 * runs over fixed-length input and cannot leak the secret's length.
 */
async function equals(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([
    crypto.subtle.digest("SHA-256", bytes(a)),
    crypto.subtle.digest("SHA-256", bytes(b)),
  ]);
  const left = new Uint8Array(x);
  const right = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

export async function passwordMatches(input: string): Promise<boolean> {
  const expected = adminPassword();
  if (!expected) return false;
  return equals(input, expected);
}

/** `<expiry-ms>.<signature>` — self-contained, so there is no session store. */
export async function createSessionToken(now = Date.now()): Promise<string> {
  const expiresAt = String(now + SESSION_TTL_MS);
  return `${expiresAt}.${await hmac(expiresAt, signingKey())}`;
}

export async function isValidSessionToken(
  token: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  if (!token || !isAdminConfigured()) return false;

  const separator = token.indexOf(".");
  if (separator < 1) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < now) return false;

  return equals(signature, await hmac(expiresAt, signingKey()));
}
