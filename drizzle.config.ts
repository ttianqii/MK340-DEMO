import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Local dev falls back to a plain SQLite file; set TURSO_DATABASE_URL
    // (+ TURSO_AUTH_TOKEN) to target the hosted Turso database.
    url: process.env.TURSO_DATABASE_URL ?? "file:sqlite.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
