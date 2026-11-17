import type Database from "better-sqlite3";
import { cleanName, localTimestamp, parseDollarsToCents, parseStock } from "./money";

export class AppError extends Error {}

export type Product = {
  id: number;
  name: string;
  priceCents: number;
  stock: number;
};

export type SaleItem = {
  name: string;
  qty: number;
  unitPriceCents: number;
  lineCents: number;
};

export type Sale = {
  id: number;
  createdAt: string;
  totalCents: number;
  items: SaleItem[];
};

type ProductRow = {
  id: number;
  name: string;
  price_cents: number;
  stock: number;
  active: number;
};

export function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0 AND price_cents <= 1000000000),
      stock INTEGER NOT NULL CHECK (stock >= 0 AND stock <= 100000),
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY,
      created_at TEXT NOT NULL,
      total_cents INTEGER NOT NULL CHECK (total_cents >= 0 AND total_cents <= 1000000000)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL CHECK (qty > 0 AND qty <= 999),
      unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
      line_cents INTEGER NOT NULL CHECK (line_cents >= 0)
    );

    CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
  `);
}

function toProduct(row: ProductRow): Product {
  return { id: row.id, name: row.name, priceCents: row.price_cents, stock: row.stock };
}

export function listProducts(db: Database.Database): Product[] {
  const rows = db
    .prepare(
      "SELECT id, name, price_cents, stock, active FROM products WHERE active = 1 ORDER BY name COLLATE NOCASE, id",
    )
    .all() as ProductRow[];
  return rows.map(toProduct);
}

export function createProduct(db: Database.Database, name: string, price: string, stock: string): void {
  const clean = cleanName(name);
  const priceCents = parseDollarsToCents(price);
  const qty = parseStock(stock);
  if (!clean || priceCents === null || qty === null) {
    throw new AppError("Enter a name, a price like 3.50, and a stock count.");
  }
  db.prepare("INSERT INTO products (name, price_cents, stock) VALUES (?, ?, ?)").run(clean, priceCents, qty);
}

export function updateProduct(
  db: Database.Database,
  id: number,
  name: string,
  price: string,
  stock: string,
): void {
  if (!Number.isInteger(id) || id < 1) throw new AppError("That product is no longer on the list.");
  const clean = cleanName(name);
  const priceCents = parseDollarsToCents(price);
  const qty = parseStock(stock);
  if (!clean || priceCents === null || qty === null) {
    throw new AppError("Enter a name, a price like 3.50, and a stock count.");
  }
  const result = db
    .prepare("UPDATE products SET name = ?, price_cents = ?, stock = ? WHERE id = ? AND active = 1")
    .run(clean, priceCents, qty, id);
  if (result.changes !== 1) throw new AppError("That product is no longer on the list.");
}

export function removeProduct(db: Database.Database, id: number): void {
  if (!Number.isInteger(id) || id < 1) throw new AppError("That product is no longer on the list.");
  const result = db.prepare("UPDATE products SET active = 0 WHERE id = ? AND active = 1").run(id);
  if (result.changes !== 1) throw new AppError("That product is no longer on the list.");
}

export type SaleLine = { productId: number; qty: number };

function mergeLines(lines: SaleLine[]): Map<number, number> {
  if (!Array.isArray(lines)) throw new AppError("Invalid sale.");
  if (lines.length === 0) throw new AppError("Add at least one item.");
  if (lines.length > 40) throw new AppError("Too many items.");
  const merged = new Map<number, number>();
  for (const line of lines) {
    if (!line || typeof line !== "object") throw new AppError("Invalid sale.");
    const productId = line.productId;
    const qty = line.qty;
    if (!Number.isInteger(productId) || productId < 1) throw new AppError("Invalid sale.");
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) throw new AppError("Invalid quantity.");
    const next = (merged.get(productId) ?? 0) + qty;
    if (next > 999) throw new AppError("Invalid quantity.");
    merged.set(productId, next);
  }
  if (merged.size > 40) throw new AppError("Too many items.");
  return merged;
}

export function checkout(db: Database.Database, lines: SaleLine[], now = new Date()): number {
  const merged = mergeLines(lines);
  const stamp = localTimestamp(now);
  const run = db.transaction(() => {
    const read = db.prepare(
      "SELECT id, name, price_cents, stock, active FROM products WHERE id = ?",
    );
    const dec = db.prepare(
      "UPDATE products SET stock = stock - ? WHERE id = ? AND active = 1 AND stock >= ?",
    );
    const items: { product: ProductRow; qty: number; lineCents: number }[] = [];
    let total = 0;

    for (const [productId, qty] of merged) {
      const product = read.get(productId) as ProductRow | undefined;
      if (!product || product.active !== 1) throw new AppError("A product in the cart is unavailable.");
      if (product.stock < qty) throw new AppError(`${product.name} has ${product.stock} in stock.`);
      const lineCents = product.price_cents * qty;
      if (!Number.isSafeInteger(lineCents)) throw new AppError("Total is too large.");
      total += lineCents;
      if (!Number.isSafeInteger(total) || total > 1_000_000_000) throw new AppError("Total is too large.");
      items.push({ product, qty, lineCents });
    }

    const sale = db.prepare("INSERT INTO sales (created_at, total_cents) VALUES (?, ?)").run(stamp, total);
    const saleId = Number(sale.lastInsertRowid);
    const insert = db.prepare(
      "INSERT INTO sale_items (sale_id, product_id, name, qty, unit_price_cents, line_cents) VALUES (?, ?, ?, ?, ?, ?)",
    );

    for (const item of items) {
      const updated = dec.run(item.qty, item.product.id, item.qty);
      if (updated.changes !== 1) throw new AppError("Stock changed. Check the cart and try again.");
      insert.run(
        saleId,
        item.product.id,
        item.product.name,
        item.qty,
        item.product.price_cents,
        item.lineCents,
      );
    }

    return saleId;
  });

  return run();
}

export function getSale(db: Database.Database, id: number): Sale | null {
  if (!Number.isInteger(id) || id < 1) return null;
  const sale = db.prepare("SELECT id, created_at, total_cents FROM sales WHERE id = ?").get(id) as
    | { id: number; created_at: string; total_cents: number }
    | undefined;
  if (!sale) return null;
  const items = db
    .prepare(
      "SELECT name, qty, unit_price_cents AS unitPriceCents, line_cents AS lineCents FROM sale_items WHERE sale_id = ? ORDER BY id",
    )
    .all(sale.id) as SaleItem[];
  return { id: sale.id, createdAt: sale.created_at, totalCents: sale.total_cents, items };
}

export function todayRevenue(db: Database.Database, now = new Date()): { totalCents: number; count: number } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(total_cents), 0) AS totalCents, COUNT(*) AS count FROM sales WHERE created_at >= ? AND created_at < ?",
    )
    .get(localTimestamp(start), localTimestamp(end)) as { totalCents: number; count: number };
  return { totalCents: row.totalCents, count: row.count };
}
