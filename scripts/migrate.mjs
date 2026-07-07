// Apply Drizzle migrations to the SQLite file before the server starts.
//
// Run inside the container entrypoint. Resolves better-sqlite3 / drizzle-orm
// from the standalone node_modules (cwd), and reads the compiled migrations
// from ./drizzle. Idempotent: drizzle tracks applied migrations in the DB.
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const dbFile = process.env.DATABASE_URL ?? "sqlite.db";
const sqlite = new Database(dbFile);
sqlite.pragma("journal_mode = WAL");

migrate(drizzle(sqlite), { migrationsFolder: "./drizzle" });
sqlite.close();

console.log(`Migrations applied to ${dbFile}`);
