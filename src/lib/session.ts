import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const TWELVE_HOURS = 60 * 60 * 12;

function secret(): string | null {
  const value = process.env.SESSION_SECRET ?? "";
  if (value.length < 32) return null;
  return value;
}

export function signSession(nowSeconds = Math.floor(Date.now() / 1000)): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(
    JSON.stringify({ exp: nowSeconds + TWELVE_HOURS, n: randomBytes(8).toString("hex") }),
  ).toString("base64url");
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const key = secret();
  if (!key || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || payload.length > 512 || !/^[A-Za-z0-9_-]+$/.test(payload)) return false;
  if (!sig || !/^[A-Za-z0-9_-]+$/.test(sig)) return false;

  const actual = Buffer.from(sig, "base64url");
  const expected = createHmac("sha256", key).update(payload).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof data.exp === "number" && Number.isInteger(data.exp) && data.exp > nowSeconds;
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = "pos_session";
export const SESSION_MAX_AGE = TWELVE_HOURS;
