// Apply Drizzle migrations to MariaDB.
//
//   DB_HOST=... DB_PORT=... DB_USER=... DB_PASSWORD=... DB_NAME=... node scripts/migrate.mjs
//
// Reads the compiled migrations from ./drizzle. Idempotent: drizzle tracks
// applied migrations in the database. Retries the initial connection since
// the mariadb container may still be starting up when this runs.
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

const config = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "app",
  password: process.env.DB_PASSWORD ?? "app",
  database: process.env.DB_NAME ?? "study_plan",
};

async function connectWithRetry(attempts = 20, delayMs = 1500) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const pool = mysql.createPool(config);
      await pool.query("SELECT 1");
      return pool;
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`Waiting for MariaDB (${i}/${attempts})...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

const pool = await connectWithRetry();
await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
console.log(`Migrations applied to ${config.host}:${config.port}/${config.database}`);
await pool.end();
