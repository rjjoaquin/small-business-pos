import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, formatCents, parseDollarsToCents, parseStock } from "./money";

test("formats cents without floating point", () => {
  assert.equal(formatCents(0), "$0.00");
  assert.equal(formatCents(1), "$0.01");
  assert.equal(formatCents(199), "$1.99");
  assert.equal(formatCents(1050), "$10.50");
});

test("parses dollar input", () => {
  assert.equal(parseDollarsToCents("3"), 300);
  assert.equal(parseDollarsToCents("3.5"), 350);
  assert.equal(parseDollarsToCents("3.50"), 350);
  assert.equal(parseDollarsToCents("0.01"), 1);
  assert.equal(parseDollarsToCents(""), null);
  assert.equal(parseDollarsToCents("3.555"), null);
  assert.equal(parseDollarsToCents("$3.00"), null);
  assert.equal(parseDollarsToCents("-1"), null);
});

test("parses stock and names", () => {
  assert.equal(parseStock("0"), 0);
  assert.equal(parseStock("12"), 12);
  assert.equal(parseStock("12.5"), null);
  assert.equal(parseStock("-1"), null);
  assert.equal(cleanName("  Coffee  "), "Coffee");
  assert.equal(cleanName("x".repeat(61)), null);
  assert.equal(cleanName("bad\nname"), "badname");
});
