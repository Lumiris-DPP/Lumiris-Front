# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# LUMIRIS · @lumiris/mobile — export statique Next servi par nginx
# (le shell Tauri consomme le même `out/`, cf. src-tauri/tauri.conf.json).
# Build context MUST be the monorepo root.
#   docker build -f apps/mobile/Dockerfile -t lumiris-mobile:$(git rev-parse --short HEAD) .
# ─────────────────────────────────────────────────────────────────────────────

ARG BUN_VERSION=1.3.14
ARG NGINX_VERSION=1.27

# ── build ── install (dev deps inclus) + export statique Next vers out/ ──────
FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
RUN NODE_ENV=production bun run --filter @lumiris/mobile build

# ── runtime ── nginx non privilégié, uniquement les fichiers statiques ───────
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS runtime
COPY apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/mobile/out /usr/share/nginx/html

EXPOSE 3002
