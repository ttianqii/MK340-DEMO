// Run a plain .sql file of statements against MariaDB. Used for the bulk
// class_schedule seed (scripts/seed-class-schedule.sql) — a raw INSERT dump
// that doesn't need Drizzle's insert() API.
//
//   node scripts/seed-sql.mjs scripts/seed-class-schedule.sql
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/seed-sql.mjs <path-to.sql>");
  process.exit(1);
}

const config = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "app",
  password: process.env.DB_PASSWORD ?? "app",
  database: process.env.DB_NAME ?? "study_plan",
  multipleStatements: true,
};

async function connectWithRetry(attempts = 20, delayMs = 1500) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const conn = await mysql.createConnection(config);
      await conn.query("SELECT 1");
      return conn;
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`Waiting for MariaDB (${i}/${attempts})...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

const sql = readFileSync(file, "utf8");
const conn = await connectWithRetry();
const [result] = await conn.query(sql);
const statements = Array.isArray(result) ? result.length : 1;
console.log(`Ran ${statements} statement(s) from ${file}`);
await conn.end();
