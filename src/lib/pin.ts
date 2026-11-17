import { scryptSync, timingSafeEqual } from "crypto";

export function verifyPin(input: string, expected: string, salt: string, cost = 16384): boolean {
  if (input.length < 1 || input.length > 128 || expected.length < 1 || expected.length > 128) return false;
  if (salt.length < 32) return false;
  const a = scryptSync(input, salt, 32, { N: cost, maxmem: 64 * 1024 * 1024 });
  const b = scryptSync(expected, salt, 32, { N: cost, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(a, b);
}

export function configError(): string | null {
  const pin = process.env.POS_PIN ?? "";
  const secret = process.env.SESSION_SECRET ?? "";
  if (pin.length < 8 || pin.length > 128 || secret.length < 32) {
    return "Set POS_PIN (8+ characters) and SESSION_SECRET (32+ characters).";
  }
  return null;
}
