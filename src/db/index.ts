import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// libSQL connection.
//
// In production (Vercel), point at a hosted Turso database with:
//   TURSO_DATABASE_URL=libsql://<db>-<org>.turso.io
//   TURSO_AUTH_TOKEN=<token>
//
// For local development it falls back to a plain SQLite file that the libSQL
// client reads/writes directly — so there is no native `better-sqlite3` build
// step, and the same code runs on Vercel's read-only, ephemeral filesystem
// because queries go to the remote Turso database over the network.
const url = process.env.TURSO_DATABASE_URL ?? "file:sqlite.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });

export { schema };
