# syntax=docker/dockerfile:1

# ── Builder ───────────────────────────────────────────────────────────────
# Debian (glibc) base so better-sqlite3 gets a prebuilt binary; build tools
# are present as a fallback if it has to compile from source.
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install deps against the committed lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build the standalone server (traces node_modules, incl. the native binary).
COPY . .
RUN npm run build

# ── Runner ──────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=/data/sqlite.db

# Standalone server + assets. `public` and `.next/static` are not copied into
# standalone automatically, so add them explicitly.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Migration runner + SQL files, run by the entrypoint before the server boots.
# Next bundles drizzle-orm into the server chunks, so it is absent from the
# traced standalone node_modules — copy it back for migrate.mjs (it has no
# runtime deps of its own; better-sqlite3 is already traced in).
COPY --from=builder /app/scripts/migrate.mjs ./migrate.mjs
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# SQLite lives on a mounted volume so data survives container restarts.
VOLUME /data

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
