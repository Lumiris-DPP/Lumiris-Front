# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# LUMIRIS · @lumiris/admin — multi-stage Bun image
# Build context MUST be the monorepo root (workspaces are required).
#   docker build -f apps/admin/Dockerfile -t lumiris-admin:$(git rev-parse --short HEAD) .
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

# Public env inlined into the bundle at build time (Next.js bakes NEXT_PUBLIC_*).
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ARG NEXT_PUBLIC_SENTRY_DSN=
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
RUN NODE_ENV=production bun run --filter @lumiris/admin build

# ── runtime ── Node distroless, uniquement le bundle standalone ──────────────
FROM gcr.io/distroless/nodejs${NODE_VERSION}-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build --chown=nonroot:nonroot /repo/apps/admin/.next/standalone ./
COPY --from=build --chown=nonroot:nonroot /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=nonroot:nonroot /repo/apps/admin/public ./apps/admin/public

USER nonroot
EXPOSE 3001
CMD ["apps/admin/server.js"]
