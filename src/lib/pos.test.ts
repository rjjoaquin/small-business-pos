import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { AppError, checkout, createProduct, getSale, listProducts, migrate, removeProduct, todayRevenue, updateProduct } from "./pos";

function openDb() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

test("stores a hostile product name as data", () => {
  const db = openDb();
  const name = "x'); DROP TABLE products;--";
  createProduct(db, name, "1.25", "3");
  const products = listProducts(db);
  assert.equal(products.length, 1);
  assert.equal(products[0]?.name, name);
  assert.equal(products[0]?.priceCents, 125);
  assert.deepEqual(db.prepare("SELECT COUNT(*) AS count FROM products").get(), { count: 1 });
});

test("charges the database price and decrements stock", () => {
  const db = openDb();
  createProduct(db, "Coffee", "3.50", "5");
  const product = listProducts(db)[0];
  assert.ok(product);
  const saleId = checkout(db, [{ productId: product.id, qty: 2 }]);
  const sale = getSale(db, saleId);
  assert.equal(sale?.totalCents, 700);
  assert.equal(sale?.items[0]?.unitPriceCents, 350);
  assert.equal(listProducts(db)[0]?.stock, 3);
});

test("does not sell more than the stock on hand", () => {
  const db = openDb();
  createProduct(db, "Tea", "2.00", "1");
  const product = listProducts(db)[0];
  assert.ok(product);
  assert.throws(() => checkout(db, [{ productId: product.id, qty: 2 }]), AppError);
  assert.equal(listProducts(db)[0]?.stock, 1);
  assert.equal(todayRevenue(db).count, 0);
});

test("removed products cannot be sold", () => {
  const db = openDb();
  createProduct(db, "Muffin", "4.00", "4");
  const product = listProducts(db)[0];
  assert.ok(product);
  removeProduct(db, product.id);
  assert.equal(listProducts(db).length, 0);
  assert.throws(() => checkout(db, [{ productId: product.id, qty: 1 }]), AppError);
});

test("today excludes yesterday", () => {
  const db = openDb();
  createProduct(db, "Soup", "5.00", "10");
  const product = listProducts(db)[0];
  assert.ok(product);
  const today = new Date(2026, 10, 18, 9, 0, 0);
  const yesterday = new Date(2026, 10, 17, 9, 0, 0);
  checkout(db, [{ productId: product.id, qty: 1 }], yesterday);
  checkout(db, [{ productId: product.id, qty: 2 }], today);
  const summary = todayRevenue(db, today);
  assert.equal(summary.count, 1);
  assert.equal(summary.totalCents, 1000);
});

test("rejects a bad price on update", () => {
  const db = openDb();
  createProduct(db, "Roll", "1.00", "2");
  const product = listProducts(db)[0];
  assert.ok(product);
  assert.throws(() => updateProduct(db, product.id, "Roll", "1.234", "2"), AppError);
  assert.equal(listProducts(db)[0]?.priceCents, 100);
});
