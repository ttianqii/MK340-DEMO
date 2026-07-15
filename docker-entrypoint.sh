#!/bin/sh
set -e

# Bring the schema up to date, then load the demo data (both idempotent —
# safe to run on every container start), then hand off to the Next.js
# standalone server.
node scripts/migrate.mjs
node scripts/seed-sql.mjs scripts/seed-class-schedule.sql
if [ -f scripts/seed-demo-students.sql ]; then
  node scripts/seed-sql.mjs scripts/seed-demo-students.sql
fi

exec node server.js
