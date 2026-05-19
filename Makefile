ifeq ($(OS),Windows_NT)
  GIT_USRBIN := $(dir $(firstword $(wildcard C:/PROGRA~1/Git/usr/bin/sh.exe C:/PROGRA~2/Git/usr/bin/sh.exe)))
  $(if $(GIT_USRBIN),,$(error Git for Windows requis — https://git-scm.com/download/win))
  export PATH := $(GIT_USRBIN);$(USERPROFILE)\.bun\bin;$(PATH)
  SHELL := $(GIT_USRBIN)sh.exe
else
  SHELL := /bin/bash
  ifneq (,$(wildcard $(HOME)/.bun/bin/bun))
    export PATH := $(HOME)/.bun/bin:$(PATH)
  endif
endif
.SHELLFLAGS := -c
.DEFAULT_GOAL := help

ifneq (,$(wildcard .env))
include .env
export
endif

BUN      ?= bun
TURBO    ?= $(BUN) x turbo
ENV      ?= dev
NODE_ENV ?= development

##@ Help
.PHONY: help
help: ## Liste les targets groupés par section
	@awk 'BEGIN { FS = ":.*?##[ @]" } \
	      /^##@ / { printf "\n\033[1;33m%s\033[0m\n", substr($$0, 5); next } \
	      /^[a-zA-Z0-9_-]+:.*?## / { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' \
	      $(MAKEFILE_LIST)
	@printf '\n\033[1;33mVariables\033[0m  ENV=%s · BUN=%s · NODE_ENV=%s\n' "$(ENV)" "$(BUN)" "$(NODE_ENV)"

##@ Bootstrap
.PHONY: install prepare setup
install: ## Installe toutes les dépendances (Bun workspaces)
	$(BUN) install
prepare: ## Init Husky (hooks pre-commit + commit-msg)
	$(BUN) run prepare
setup: install prepare ## Bootstrap complet (install + husky)
	@echo "[setup] OK · run 'make dev' to start"

##@ Dev
.PHONY: dev dev-admin dev-site dev-mobile dev-client
dev: ## Lance admin + site + mobile en parallèle (Turbo)
	$(BUN) run dev
dev-admin: ## Back-office uniquement (port 3001)
	$(BUN) run dev:admin
dev-site: ## Site public uniquement (port 3000)
	$(BUN) run dev:site
dev-mobile: ## Vue mobile uniquement (port 3002)
	$(BUN) run dev:mobile
dev-client: ## Workspace artisan B2B uniquement (port 3003)
	$(BUN) run dev:client

##@ Build
.PHONY: build build-admin build-site build-mobile build-client check-client start
build: ## Build tous les apps (Turbo cache)
	$(BUN) run build
build-admin: ## Build admin seulement
	$(TURBO) run build --filter=@lumiris/admin
build-site: ## Build site seulement
	$(TURBO) run build --filter=@lumiris/site
build-mobile: ## Build mobile seulement
	$(TURBO) run build --filter=@lumiris/mobile
build-client: ## Build client seulement
	$(TURBO) run build --filter=@lumiris/client
check-client: ## Lint + typecheck sur client seulement
	$(TURBO) run lint typecheck --filter=@lumiris/client
start: ## Démarre tous les apps en mode prod
	$(BUN) run start

##@ Code quality
.PHONY: lint lint-fix lint-css format format-check typecheck test knip knip-fix check fix
lint: ## ESLint sur tous les workspaces (check)
	$(BUN) run lint
lint-fix: ## ESLint auto-fix
	$(BUN) run lint:fix
lint-css: ## Stylelint sur le DS et globals
	$(BUN) run lint:css
format: ## Prettier sur tous les fichiers
	$(BUN) run format
format-check: ## Prettier check (CI-friendly)
	$(BUN) run format:check
typecheck: ## TypeScript strict sur tous les workspaces
	$(BUN) run typecheck
test: ## Tests Bun + Vitest (selon les workspaces)
	$(BUN) run test
knip: ## Code mort + deps inutilisées
	$(BUN) run knip
knip-fix: ## Knip + auto-fix des deps en trop
	$(BUN) run knip:fix
check: lint lint-css typecheck test ## Quality gate complet (avant commit)
fix: ## Auto-fix tout (lint + css + format)
	$(BUN) run fix

##@ Performance
.PHONY: lhci lighthouse-mobile lighthouse-desktop
lhci: ## Lighthouse CI sur le site public
	$(BUN) run lhci
lighthouse-mobile: ## Audit Lighthouse mobile profile (URL=http://localhost:3000)
	@test -n "$(URL)" || { echo "Usage: URL=<url> make lighthouse-mobile"; exit 1; }
	$(BUN) x lighthouse "$(URL)" --output=html --output-path=./.lighthouse-mobile.html --quiet
lighthouse-desktop: ## Audit Lighthouse desktop profile (URL=http://localhost:3000)
	@test -n "$(URL)" || { echo "Usage: URL=<url> make lighthouse-desktop"; exit 1; }
	$(BUN) x lighthouse "$(URL)" --preset=desktop --output=html --output-path=./.lighthouse-desktop.html --quiet

##@ Tauri
MOBILE_DIR := apps/mobile
TAURI_DIR  := $(MOBILE_DIR)/src-tauri
TAURI      := cd $(MOBILE_DIR) && $(BUN) x @tauri-apps/cli@latest
.PHONY: tauri-init tauri-dev tauri-build tauri-android-init tauri-android-dev tauri-ios-init tauri-ios-dev
tauri-init: ## Initialise Tauri 2.0 dans apps/mobile (one-shot)
	@test ! -d "$(TAURI_DIR)" || { echo "[tauri-init] $(TAURI_DIR) existe déjà"; exit 1; }
	$(TAURI) init
	@echo "[tauri-init] OK · run 'make tauri-dev' pour démarrer"
tauri-dev: ## Mode dev Tauri (HMR Next + bridge Rust)
	@test -d "$(TAURI_DIR)" || { echo "[tauri-dev] lance d'abord 'make tauri-init'"; exit 1; }
	$(TAURI) dev
tauri-build: ## Build Tauri release (binaires natifs platform-specific)
	@test -d "$(TAURI_DIR)" || { echo "[tauri-build] lance d'abord 'make tauri-init'"; exit 1; }
	$(TAURI) build
tauri-android-init: ## Bootstrap target Android (NDK requis)
	$(TAURI) android init
tauri-android-dev: ## Dev sur émulateur/device Android
	$(TAURI) android dev
tauri-ios-init: ## Bootstrap target iOS (Xcode requis, macOS only)
	$(TAURI) ios init
tauri-ios-dev: ## Dev sur simulateur/device iOS
	$(TAURI) ios dev

##@ Observability
COMPOSE_MONITORING := docker compose -f docker-compose.monitoring.yml --profile monitoring
GRAFANA_URL ?= http://localhost:3030
PROM_URL    ?= http://localhost:9090
.PHONY: monitoring-up monitoring-down monitoring-nuke monitoring-logs monitoring-reload slo
monitoring-up: ## Lance Tempo + Prometheus + Loki + Grafana (profile monitoring)
	$(COMPOSE_MONITORING) up -d
	@printf '\n  \033[1;32m%-11s\033[0m %s\n' \
	  Grafana     "$(GRAFANA_URL)        (anon admin)" \
	  Prometheus  "$(PROM_URL)" \
	  "Tempo OTLP" "http://localhost:4318  (HTTP)" \
	  Loki        "http://localhost:3100"
	@printf '\n  Dashboard: %s/d/lumiris-overview\n' "$(GRAFANA_URL)"
monitoring-down: ## Stoppe la stack observabilité (volumes conservés)
	$(COMPOSE_MONITORING) down
monitoring-nuke: ## Stoppe et SUPPRIME les volumes (perte de données Prom/Tempo/Loki)
	$(COMPOSE_MONITORING) down -v
monitoring-logs: ## Tail des logs des 4 services
	$(COMPOSE_MONITORING) logs -f --tail=100
monitoring-reload: ## Reload Prom rules + datasources sans restart
	curl -sS -X POST $(PROM_URL)/-/reload && echo "[prom] config reloaded"
slo: ## Affiche l'état des SLOs (availability + p95 score latency)
	@printf '\033[1;33m# Availability (30d, target 99.9%%)\033[0m\n'
	@curl -sG --data-urlencode 'query=lumiris:api_availability_30d' \
	    $(PROM_URL)/api/v1/query | \
	    awk -F'"value":\\[[^,]+,"' '{ if (NF>1) print "  " substr($$2, 1, index($$2,"\"")-1); else print "  no data" }'
	@printf '\033[1;33m# Score latency p95 (5m, target <250ms)\033[0m\n'
	@curl -sG --data-urlencode 'query=lumiris:score_latency_p95_5m' \
	    $(PROM_URL)/api/v1/query | \
	    awk -F'"value":\\[[^,]+,"' '{ if (NF>1) print "  " substr($$2, 1, index($$2,"\"")-1) "s"; else print "  no data" }'
	@printf '\033[1;33m# Active SLO alerts\033[0m\n'
	@curl -sG --data-urlencode 'query=ALERTS{slo!=""}' \
	    $(PROM_URL)/api/v1/query | \
	    grep -oE '"alertname":"[^"]+"' | sort -u | sed 's/^/  /' || echo "  (none firing)"

##@ Maintenance
.PHONY: clean clean-all reset doctor
clean: ## Nettoie .next + .turbo + dist
	$(BUN) run clean
clean-all: ## Tout nettoyer (y compris node_modules)
	$(BUN) run clean:all
reset: clean-all install ## Reset complet (dernière chance)
doctor: ## Vérifie les versions des outils requis
	@printf '\033[1;33m# Versions installées\033[0m\n'
	@printf "  bun         : "; bun --version 2>/dev/null || echo MISSING
	@printf "  node        : "; node --version 2>/dev/null || echo MISSING
	@printf "  rustc       : "; rustc --version 2>/dev/null || echo "(facultatif - requis pour Tauri)"
	@printf "  cargo       : "; cargo --version 2>/dev/null || echo "(facultatif - requis pour Tauri)"
	@printf "  git         : "; git --version 2>/dev/null || echo MISSING

##@ CI
.PHONY: ci
ci: install check build ## Pipeline CI exécuté localement (install + check + build)

##@ Docker
GIT_SHA    := $(shell git rev-parse --short HEAD 2>/dev/null || echo dev)
IMAGE_TAG  ?= $(GIT_SHA)
GHCR_OWNER ?= lumiris
REGISTRY   ?= ghcr.io
APPS       := admin client site mobile api
.PHONY: docker-build docker-build-app docker-push
docker-build: ## Build les 5 images (admin, client, site, mobile, api) — IMAGE_TAG=<sha>
	@for app in $(APPS); do \
	  echo "[docker-build] $$app:$(IMAGE_TAG)"; \
	  docker build -f apps/$$app/Dockerfile -t $(REGISTRY)/$(GHCR_OWNER)/$$app:$(IMAGE_TAG) . || exit 1; \
	done
docker-build-app: ## Build une seule image (APP=admin|client|site|mobile|api)
	@test -n "$(APP)" || { echo "Usage: APP=<admin|client|site|mobile|api> make docker-build-app"; exit 1; }
	docker build -f apps/$(APP)/Dockerfile -t $(REGISTRY)/$(GHCR_OWNER)/$(APP):$(IMAGE_TAG) .
docker-push: ## Pousse les 5 images vers GHCR (login préalable requis)
	@for app in $(APPS); do \
	  docker push $(REGISTRY)/$(GHCR_OWNER)/$$app:$(IMAGE_TAG) || exit 1; \
	done

##@ Stack
COMPOSE_FILES := -f docker-compose.yml -f docker-compose.$(ENV).yml
COMPOSE_STACK := IMAGE_TAG=$(IMAGE_TAG) GHCR_OWNER=$(GHCR_OWNER) docker compose $(COMPOSE_FILES)
.PHONY: stack-up stack-down stack-logs stack-ps
stack-up: ## Démarre la stack (ENV=dev|prod, IMAGE_TAG=<sha>)
	$(COMPOSE_STACK) up -d
stack-down: ## Stoppe la stack
	$(COMPOSE_STACK) down
stack-logs: ## Logs en suivi (SVC=api pour un seul service)
	$(COMPOSE_STACK) logs -f $(SVC)
stack-ps: ## Liste les services en cours
	$(COMPOSE_STACK) ps

##@ Deploy
HEALTH_TIMEOUT ?= 240
DEPLOY_SVCS    ?= admin client site mobile api
.PHONY: deploy-zd rollback
deploy-zd: ## Zero-downtime deploy (IMAGE_TAG=<sha>) — scale +1 → wait healthy → scale -1
	@test "$(IMAGE_TAG)" != "latest" || { echo "[deploy-zd] refus: IMAGE_TAG=latest interdit en prod"; exit 1; }
	@echo "[deploy-zd] tag=$(IMAGE_TAG) timeout=$(HEALTH_TIMEOUT)s"
	@$(COMPOSE_STACK) pull $(DEPLOY_SVCS)
	@for svc in $(DEPLOY_SVCS); do \
	  current=$$($(COMPOSE_STACK) ps --quiet $$svc | wc -l); \
	  target=$$((current + 1)); \
	  echo "[deploy-zd] $$svc: scale $$current → $$target (start-first)"; \
	  $(COMPOSE_STACK) up -d --no-deps --scale $$svc=$$target --no-recreate $$svc || exit 1; \
	  echo "[deploy-zd] $$svc: waiting healthy ($(HEALTH_TIMEOUT)s)"; \
	  deadline=$$(( $$(date +%s) + $(HEALTH_TIMEOUT) )); \
	  while [ $$(date +%s) -lt $$deadline ]; do \
	    healthy=$$($(COMPOSE_STACK) ps --format '{{.Service}} {{.Health}}' | grep "^$$svc " | grep -c healthy); \
	    if [ $$healthy -ge $$target ]; then echo "[deploy-zd] $$svc: $$healthy/$$target healthy"; break; fi; \
	    sleep 5; \
	  done; \
	  if [ $$(date +%s) -ge $$deadline ]; then \
	    echo "[deploy-zd] $$svc: health timeout — rolling back"; \
	    exit 1; \
	  fi; \
	  echo "[deploy-zd] $$svc: scale $$target → $$current (drain old)"; \
	  $(COMPOSE_STACK) up -d --no-deps --scale $$svc=$$current --remove-orphans $$svc || exit 1; \
	done
	@echo "[deploy-zd] OK · all services on $(IMAGE_TAG)"
rollback: ## Rollback vers un tag précédent (TAG=<sha>)
	@test -n "$(TAG)" || { echo "Usage: make rollback TAG=<sha>"; exit 1; }
	@echo "[rollback] tag=$(TAG)"
	IMAGE_TAG=$(TAG) $(COMPOSE_STACK) pull $(DEPLOY_SVCS)
	IMAGE_TAG=$(TAG) $(COMPOSE_STACK) up -d --no-deps $(DEPLOY_SVCS)
	@echo "[rollback] OK · stack restored to $(TAG)"

##@ SBOM
SBOM_DIR ?= sbom
.PHONY: sbom sbom-sign
sbom: ## Génère un SBOM SPDX-JSON par image (IMAGE_TAG=<sha>) — requiert syft
	@command -v syft >/dev/null 2>&1 || { echo "[sbom] syft missing — https://github.com/anchore/syft"; exit 1; }
	@mkdir -p $(SBOM_DIR)
	@for app in $(APPS); do \
	  out="$(SBOM_DIR)/$$app-$(IMAGE_TAG).spdx.json"; \
	  echo "[sbom] $$app → $$out"; \
	  syft "$(REGISTRY)/$(GHCR_OWNER)/$$app:$(IMAGE_TAG)" -o spdx-json="$$out" || exit 1; \
	done
	@echo "[sbom] OK · $(SBOM_DIR)/"
sbom-sign: ## Signe les SBOMs avec cosign keyless (OIDC)
	@command -v cosign >/dev/null 2>&1 || { echo "[sbom-sign] cosign missing"; exit 1; }
	@for app in $(APPS); do \
	  cosign attest --yes \
	    --predicate $(SBOM_DIR)/$$app-$(IMAGE_TAG).spdx.json \
	    --type spdxjson \
	    "$(REGISTRY)/$(GHCR_OWNER)/$$app:$(IMAGE_TAG)" || exit 1; \
	done

##@ Bench
BENCH_DIR  := bench
BENCH_OUT  := $(BENCH_DIR)/out
SCENARIO   ?= scoring
BENCH_BASE ?= http://localhost:4000
BENCH_PROD ?= https://api.lumiris.io
.PHONY: bench-local bench-prod
bench-local: ## k6 local (SCENARIO=browse|audit|scoring · BASE=<url>)
	@command -v k6 >/dev/null 2>&1 || { echo "[bench] k6 missing — https://k6.io/docs/get-started/installation/"; exit 1; }
	@test -f $(BENCH_DIR)/scenarios/$(SCENARIO).js || { echo "[bench] unknown SCENARIO=$(SCENARIO)"; exit 1; }
	@mkdir -p $(BENCH_OUT)
	BASE=$(BENCH_BASE) k6 run $(BENCH_DIR)/scenarios/$(SCENARIO).js
bench-prod: ## k6 prod (DANGER: vérifie l'autorisation infra · BASE=<url>)
	@command -v k6 >/dev/null 2>&1 || { echo "[bench] k6 missing"; exit 1; }
	@echo "[bench-prod] cible=$(BENCH_PROD) — assure-toi d'avoir l'OK infra"
	@mkdir -p $(BENCH_OUT)
	BASE=$(BENCH_PROD) k6 run $(BENCH_DIR)/scenarios/$(SCENARIO).js

##@ Release
.PHONY: release
release: ## Tag + push (VERSION=v0.1.0) — GitHub Actions construit, signe et pousse
	@test -n "$(VERSION)" || { echo "Usage: VERSION=v0.1.0 make release"; exit 1; }
	@echo "$(VERSION)" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9.-]+)?$$' \
	  || { echo "[release] version invalide (semver attendu, ex: v0.1.0)"; exit 1; }
	git tag -a $(VERSION) -m "release $(VERSION)"
	git push origin $(VERSION)
	@echo "[release] tag $(VERSION) poussé"
