import assert from "node:assert/strict";
import test from "node:test";
import { verifyPin } from "./pin";

const salt = "p".repeat(32);

test("pin check", () => {
  assert.equal(verifyPin("correct-pin", "correct-pin", salt, 1024), true);
  assert.equal(verifyPin("wrong-pin", "correct-pin", salt, 1024), false);
  assert.equal(verifyPin("x".repeat(200), "correct-pin", salt, 1024), false);
  assert.equal(verifyPin("correct-pin", "correct-pin", "short", 1024), false);
});
