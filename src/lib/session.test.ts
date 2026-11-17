import assert from "node:assert/strict";
import test from "node:test";
import { signSession, verifySession } from "./session";

const secret = "s".repeat(40);

test("session round trip", () => {
  process.env.SESSION_SECRET = secret;
  const now = 1_700_000_000;
  const token = signSession(now);
  assert.ok(token);
  assert.equal(verifySession(token, now + 10), true);
  assert.equal(verifySession(token, now + 60 * 60 * 12), false);
});

test("rejects a tampered session", () => {
  process.env.SESSION_SECRET = secret;
  const token = signSession(1_700_000_000);
  assert.ok(token);
  const [payload, sig] = token.split(".");
  const flipped = `${payload.slice(0, -1)}${payload.endsWith("a") ? "b" : "a"}.${sig}`;
  assert.equal(verifySession(flipped, 1_700_000_000), false);
  assert.equal(verifySession(`${payload}.${sig.slice(0, -1)}a`, 1_700_000_000), false);
  assert.equal(verifySession(undefined, 1_700_000_000), false);
});

test("rejects sessions when the secret is missing", () => {
  delete process.env.SESSION_SECRET;
  assert.equal(signSession(), null);
  assert.equal(verifySession("abc.def"), false);
});
