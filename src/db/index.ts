import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Local SQLite file. Override with DATABASE_URL for a different path.
const DB_FILE = process.env.DATABASE_URL ?? "sqlite.db";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// Open the connection lazily on first use. Opening at module load runs the
// WAL pragma (an exclusive-lock write) at import time, which collides across
// `next build`'s parallel page-data workers (SQLITE_BUSY). Deferring it means
// the DB is only touched when a query actually runs — never during the build.
let instance: DrizzleDb | undefined;

function getDb(): DrizzleDb {
  if (!instance) {
    const sqlite = new Database(DB_FILE);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("busy_timeout = 5000");
    instance = drizzle(sqlite, { schema });
  }
  return instance;
}

// Proxy keeps the `db.select()...` call sites unchanged while deferring the
// actual connection. Methods are bound to the real instance so drizzle's
// internal `this` stays intact.
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
}) satisfies DrizzleDb;

export { schema };
