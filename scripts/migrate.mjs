// Apply Drizzle migrations to the libSQL / Turso database.
//
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate.mjs
//
// Reads the compiled migrations from ./drizzle. Idempotent: drizzle tracks
// applied migrations in the database. Falls back to a local SQLite file when
// TURSO_DATABASE_URL is unset, for local development.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.TURSO_DATABASE_URL ?? "file:sqlite.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

await migrate(drizzle(client), { migrationsFolder: "./drizzle" });

console.log(`Migrations applied to ${url}`);
