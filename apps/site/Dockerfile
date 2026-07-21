# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# LUMIRIS · @lumiris/site — multi-stage Bun image
# Build context MUST be the monorepo root.
#   docker build -f apps/site/Dockerfile -t lumiris-site:$(git rev-parse --short HEAD) .
# ─────────────────────────────────────────────────────────────────────────────

ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=22

# ── build ── install (dev deps inclus) + compile Next (standalone) ───────────
FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
RUN NODE_ENV=production bun run --filter @lumiris/site build

# ── runtime ── Node distroless, uniquement le bundle standalone ──────────────
FROM gcr.io/distroless/nodejs${NODE_VERSION}-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build --chown=nonroot:nonroot /repo/apps/site/.next/standalone ./
COPY --from=build --chown=nonroot:nonroot /repo/apps/site/.next/static ./apps/site/.next/static
COPY --from=build --chown=nonroot:nonroot /repo/apps/site/public ./apps/site/public

USER nonroot
EXPOSE 3000
CMD ["apps/site/server.js"]
