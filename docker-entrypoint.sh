#!/bin/sh
set -e

# Ensure the SQLite file's directory exists (it lives on a mounted volume).
DB_FILE="${DATABASE_URL:-/data/sqlite.db}"
mkdir -p "$(dirname "$DB_FILE")"

# Bring the schema up to date, then hand off to the Next.js standalone server.
DATABASE_URL="$DB_FILE" node migrate.mjs
exec node server.js
