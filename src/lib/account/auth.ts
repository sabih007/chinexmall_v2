/**
 * Customer credentials and session tokens.
 *
 * Dependency-free and built on Web Crypto, for the same reason the admin side
 * is: the signature check has to run wherever a session is read, and password
 * hashing has to run without pulling a native module into the deployment.
 *
 * Passwords are stretched with PBKDF2-SHA256 and a per-account salt. Sessions
 * are stateless: the cookie carries the customer id, an expiry and an HMAC
 * over both, signed with a secret only the server holds.
 */

export const CUSTOMER_COOKIE = "cx_customer";

/**
 * Companion cookie carrying the shopper's first name, readable by the browser.
 *
 * It exists so the header can greet a signed-in shopper without a round trip
 * on every page — the session itself stays in the httpOnly cookie above, and
 * nothing is ever trusted because this one says so.
 */
export const CUSTOMER_NAME_COOKIE = "cx_customer_name";

/** How long a shopper stays signed in. Long, because a store is not a bank. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** OWASP's floor for PBKDF2-SHA256. Raise it, never lower it. */
const ITERATIONS = 210_000;
const KEY_BITS = 256;

const bytes = (value: string) => new TextEncoder().encode(value);

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomHex(byteLength: number): string {
  const buffer = new Uint8Array(byteLength);
  crypto.getRandomValues(buffer);
  return toHex(buffer.buffer);
}

/**
 * Constant-time comparison. Both sides are digested first, so the loop runs
 * over fixed-length input and cannot leak the secret's length.
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

/* -------------------------------------------------------------------------- */
/*  Passwords                                                                 */
/* -------------------------------------------------------------------------- */

async function derive(
  password: string,
  saltHex: string,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    bytes(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const salt = Uint8Array.from(
    saltHex.match(/.{2}/g) ?? [],
    (pair) => Number.parseInt(pair, 16),
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS,
  );
  return toHex(derived);
}

/** `pbkdf2$<iterations>$<salt>$<hash>` — self-describing, so the cost can be
 *  raised later without invalidating everyone's password. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomHex(16);
  return `pbkdf2$${ITERATIONS}$${salt}$${await derive(password, salt, ITERATIONS)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !/^\d+$/.test(iterations ?? "") || !salt || !hash) {
    return false;
  }
  return equals(await derive(password, salt, Number(iterations)), hash);
}

/* -------------------------------------------------------------------------- */
/*  Session tokens                                                            */
/* -------------------------------------------------------------------------- */

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    bytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, bytes(payload)));
}

/** `<customerId>.<expiry-ms>.<signature>` */
export async function createSessionToken(
  customerId: string,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const payload = `${customerId}.${now + SESSION_TTL_MS}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

/**
 * The customer id inside a token, or null if it is malformed, expired or not
 * signed by us. Says nothing about whether that customer still exists — the
 * caller looks them up.
 */
export async function readSessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<string | null> {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [customerId, expiresAt, signature] = parts;
  if (!customerId || !/^\d+$/.test(expiresAt) || Number(expiresAt) < now) {
    return null;
  }

  const expected = await hmac(`${customerId}.${expiresAt}`, secret);
  return (await equals(signature, expected)) ? customerId : null;
}
