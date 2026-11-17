import assert from "node:assert/strict";
import test from "node:test";
import { loginAllowed, recordFailure, recordSuccess, resetLoginLimit } from "./login-limit";

test("locks after repeated failures", () => {
  resetLoginLimit();
  const start = 1_000_000;
  for (let i = 0; i < 7; i += 1) recordFailure(start);
  assert.equal(loginAllowed(start), true);
  recordFailure(start);
  assert.equal(loginAllowed(start), false);
  assert.equal(loginAllowed(start + 15 * 60 * 1000), true);
});

test("a success clears failures", () => {
  resetLoginLimit();
  recordFailure(5_000);
  recordSuccess();
  for (let i = 0; i < 7; i += 1) recordFailure(5_000);
  assert.equal(loginAllowed(5_000), true);
});
