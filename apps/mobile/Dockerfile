# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# LUMIRIS · @lumiris/mobile — PWA build (Tauri shell built separately)
# Build context MUST be the monorepo root.
#   docker build -f apps/mobile/Dockerfile -t lumiris-mobile:$(git rev-parse --short HEAD) .
# ─────────────────────────────────────────────────────────────────────────────

ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=22

# ── build ── install (dev deps inclus) + compile Next (standalone) ───────────
FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
# Web/PWA build path — Tauri static export uses bun run build:tauri locally.
ENV BUILD_TARGET=web

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
RUN NODE_ENV=production bun run --filter @lumiris/mobile build

# ── runtime ── Node distroless, uniquement le bundle standalone ──────────────
FROM gcr.io/distroless/nodejs${NODE_VERSION}-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build --chown=nonroot:nonroot /repo/apps/mobile/.next/standalone ./
COPY --from=build --chown=nonroot:nonroot /repo/apps/mobile/.next/static ./apps/mobile/.next/static
COPY --from=build --chown=nonroot:nonroot /repo/apps/mobile/public ./apps/mobile/public

USER nonroot
EXPOSE 3002
CMD ["apps/mobile/server.js"]
