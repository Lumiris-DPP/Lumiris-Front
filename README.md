# LUMIRIS Ecosystem — Front

> **Clinical & Transparent.** Bun + Turbo + Next.js 16 monorepo for the LUMIRIS Digital Product Passport platform.

This repo holds the 4 user-facing Next.js apps and the shared packages. Infrastructure (Postgres, Redis, MinIO, Mailhog, Traefik, monitoring) lives in [`../Lumiris-Infra/`](../Lumiris-Infra/); the API lives in [`../Lumiris-Backend/`](../Lumiris-Backend/).

## Quickstart

```bash
# 1. Premier setup : install + .env.local par app (template fourni)
cd ../Lumiris-Front
bun install
for app in admin site client mobile; do
  cp apps/$app/.env.example apps/$app/.env.local
done

# 2. Start the local infra + backend + front via the orchestrator
cd ../Lumiris-Infra && make all-up

# 3. Or, run only the fronts locally (infra must already be up)
cd ../Lumiris-Front && bun dev
```

Chaque app pointe par defaut vers `localhost:8080`

URLs once the stack is up (see `../Lumiris-Infra/docs/SERVICES.md`):

| Surface | URL                          |
| ------- | ---------------------------- |
| Site    | https://lumiris.local        |
| Admin   | https://admin.lumiris.local  |
| Mobile  | https://mobile.lumiris.local |
| Client  | https://client.lumiris.local |
| API     | http://localhost:8080        |

## Surfaces

| Workspace     | Package           | Role                                                       | Port |
| ------------- | ----------------- | ---------------------------------------------------------- | ---- |
| `apps/admin`  | `@lumiris/admin`  | Back-office d'audit DPP — interface clinique               | 3001 |
| `apps/site`   | `@lumiris/site`   | Site public marketing + journal éditorial                  | 3000 |
| `apps/mobile` | `@lumiris/mobile` | Vue mobile-first (Iris Scanner, Deep Reveal) — Tauri-ready | 3002 |
| `apps/client` | `@lumiris/client` | Workspace artisans B2B (offre Atelier) — création de DPP   | 3003 |

## Shared packages

| Package               | Role                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `@lumiris/ui`         | Prismatic Clarity Design System (Shadcn + Tailwind v4 Opal-glow) — domain-agnostic            |
| `@lumiris/scoring-ui` | Iris V2 visualisations (`IrisGrade`, `ScoreBreakdown`, `MissingFieldsBadge`, …)               |
| `@lumiris/core`       | Iris V2 scoring algorithm (40/25/25/10 — Transparence · Savoir-faire · Impact · Réparabilité) |
| `@lumiris/utils`      | Pure runtime helpers (env, web-vitals, formatters, analytics). No JSX.                        |
| `@lumiris/mock-data`  | Shared fixtures (DPP, certificats, journal, regulatory, products) typed on `@lumiris/types`   |
| `@lumiris/types`      | DPP / IrisScore / User / JournalArticle / Regulatory                                          |
| `@lumiris/telemetry`  | OTel + Sentry adapters per surface                                                            |
| `@lumiris/api-client` | Minimal fetch wrapper typé (auth · telemetry · storage) — `openapi-typescript` plus tard      |
| `@lumiris/config`     | ESLint flat (base/react/next) · TS bases · Stylelint · Prettier                               |

## Stack

- **Runtime**: [Bun](https://bun.sh/) ≥ 1.1 (workspace native, drop-in test runner)
- **Orchestration**: [Turbo](https://turbo.build/) for cached lint/test/build pipelines
- **Apps**: Next.js 16 + React 19 + Tailwind 4
- **Quality gates**: ESLint flat config · Prettier · Knip · Husky + lint-staged · Lighthouse CI

## Folder structure

```
.
├── apps/
│   ├── admin/         # @lumiris/admin  → back-office dashboard
│   ├── site/          # @lumiris/site   → public site & journal
│   ├── mobile/        # @lumiris/mobile → mobile-optimized view + Tauri shell
│   └── client/        # @lumiris/client → artisan workspace
├── packages/
│   ├── ui/            # @lumiris/ui          → Prismatic Clarity design system
│   ├── scoring-ui/    # @lumiris/scoring-ui  → IrisGrade, ScoreBreakdown, …
│   ├── core/          # @lumiris/core        → Iris V2 scoring (40/25/25/10)
│   ├── types/         # @lumiris/types       → DPP / Score / User contracts
│   ├── utils/         # @lumiris/utils       → pure helpers
│   ├── mock-data/     # @lumiris/mock-data   → fixtures
│   ├── telemetry/     # @lumiris/telemetry   → OTel + Sentry
│   └── config/        # @lumiris/config      → ESLint · TS · Tailwind presets
├── .husky/            # pre-commit guardrails (lint, format, secret scan)
├── .github/workflows/ # CI: lint → typecheck → test → build → Lighthouse
├── turbo.json         # task graph + caching
├── tsconfig.base.json # strict TS baseline
└── Makefile           # `make help`
```

## Common tasks

`make help` lists everything. Highlights:

| Make target            | What it does                            |
| ---------------------- | --------------------------------------- |
| `make install`         | Install everything via Bun              |
| `make dev`             | Run admin + site + mobile + client      |
| `make dev-site`        | Only the public site                    |
| `make build`           | Build all apps (Turbo-cached)           |
| `make check`           | `lint` + `typecheck` + `test` + `knip`  |
| `make ci`              | Full local CI pipeline                  |
| `make clean` / `reset` | Remove build outputs / nuke + reinstall |

Docker / monitoring / bench have moved to `../Lumiris-Infra/`. From here you orchestrate everything via `cd ../Lumiris-Infra && make <target>`.

## Adding a new shared component

1. `cd packages/ui`
2. `bunx shadcn@latest add <name>`
3. The component lands in `packages/ui/src/components/ui/<name>.tsx`.
4. Consume from any app: `import { <Name> } from '@lumiris/ui/components/<name>'`.

## Deployment

Each `apps/*` builds via the `Dockerfile` next to it. Images are built and tagged from `../Lumiris-Infra/prod/docker-compose.prod.yml` (build context points back here). Until the VPS is provisioned, that file is inert — see `../Lumiris-Infra/docs/MIGRATION-TO-PROD.md`.

---

> **Philosophy.** DRY · type-safe · scalable. Every piece of code that affects the audit verdict (types, scoring, UI primitives) lives in `packages/` and is consumed identically across admin, site, mobile and client. That's the brand promise: one truth, four surfaces.
