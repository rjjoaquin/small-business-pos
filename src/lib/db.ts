import "server-only";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { migrate } from "./pos";

const globalForDb = globalThis as unknown as { posDb?: Database.Database; posPath?: string };

export function getDb(): Database.Database {
  const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "pos.sqlite");
  if (globalForDb.posDb && globalForDb.posPath === file) return globalForDb.posDb;

  if (file !== ":memory:") {
    const directory = path.dirname(file);
    fs.mkdirSync(directory, { recursive: true });
    fs.chmodSync(directory, 0o700);
  }

  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);

  if (file !== ":memory:") fs.chmodSync(file, 0o600);

  globalForDb.posDb = db;
  globalForDb.posPath = file;
  return db;
}
