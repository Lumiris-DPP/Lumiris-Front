# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# LUMIRIS · @lumiris/site — multi-stage Bun image
# Build context MUST be the monorepo root.
#   docker build -f apps/site/Dockerfile -t lumiris-site:$(git rev-parse --short HEAD) .
# ─────────────────────────────────────────────────────────────────────────────

ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=22

# ── build ── install (dev deps inclus) + compile Next (standalone) ───────────
# Node is the base image because the apps' build script runs Next under node: Bun
# segfaults (SIGILL) compiling Next 16 in a container, on alpine as on debian.
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install --global bun@${BUN_VERSION}

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Public env inlined into the bundle at build time (Next.js bakes NEXT_PUBLIC_*).
# NEXT_PUBLIC_WEB_URL is this site's own origin: it signs the canonicals, the sitemap,
# robots.txt and the JSON-LD, so an image built without it advertises another domain.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ARG NEXT_PUBLIC_WEB_URL=https://lumiris.eu
ARG NEXT_PUBLIC_CLIENT_URL=https://app.lumiris.eu
ARG NEXT_PUBLIC_SENTRY_DSN=
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL}
ENV NEXT_PUBLIC_CLIENT_URL=${NEXT_PUBLIC_CLIENT_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
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
