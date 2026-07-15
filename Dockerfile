# syntax=docker/dockerfile:1

# ── Builder ───────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Install deps against the committed lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build the standalone server (traces node_modules, incl. mysql2).
COPY . .
RUN npm run build

# ── Runner ──────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    HOSTNAME=0.0.0.0

# Standalone server + assets. `public` and `.next/static` are not copied into
# standalone automatically, so add them explicitly.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Migration/seed runner scripts + SQL files, run by the entrypoint before the
# server boots. Next bundles drizzle-orm/mysql2 into the server chunks, so
# they (and mysql2's own dependency tree) are absent from the traced
# standalone node_modules — bring the full production node_modules back for
# these standalone scripts instead of hand-picking transitive deps.
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Data lives in the mariadb container's own volume — nothing to persist here.

EXPOSE 8080
ENTRYPOINT ["./docker-entrypoint.sh"]
