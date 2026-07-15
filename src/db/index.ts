import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// MariaDB connection.
//
// In docker-compose, DB_HOST points at the `mariadb` service (its own
// container + volume — this app never talks to any external/university
// system for data). For bare local dev, point these at any MariaDB/MySQL
// instance you have running.
const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "app",
  password: process.env.DB_PASSWORD ?? "app",
  database: process.env.DB_NAME ?? "study_plan",
  connectionLimit: 10,
});

export const db = drizzle(pool, { schema, mode: "default" });

export { schema };
