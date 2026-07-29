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
	@printf '\n\033[1;33mInfra\033[0m  Pour démarrer la stack locale (Postgres, Redis, etc.) : cd ../Lumiris-Infra && make all-up\n'
	@printf '\033[1;33mVariables\033[0m  ENV=%s · BUN=%s · NODE_ENV=%s\n' "$(ENV)" "$(BUN)" "$(NODE_ENV)"

##@ Bootstrap
.PHONY: install prepare setup env-init
install: ## Installe toutes les dépendances (Bun workspaces)
	$(BUN) install
prepare: ## Init Husky (hooks pre-commit + commit-msg)
	$(BUN) run prepare
setup: install prepare env-init ## Bootstrap complet (install + husky + .env)
	@echo "[setup] OK · run 'make dev' to start (assure-toi que ../Lumiris-Infra a tourné 'make all-up' ou 'make up' avant)"
env-init: ## Génère apps/<app>/.env = .env.example.shared + .env.example (n'écrase pas)
	@for app in admin client mobile site; do \
	  target="apps/$$app/.env"; \
	  if [ -f "$$target" ]; then \
	    printf "  [env-init] skip %s (existe déjà)\n" "$$target"; \
	  else \
	    cat apps/.env.example.shared "apps/$$app/.env.example" > "$$target"; \
	    printf "  [env-init] %s\n" "$$target"; \
	  fi; \
	done

##@ Dev
.PHONY: dev dev-admin dev-site dev-mobile dev-client
dev: ## Lance admin + site + mobile + client en parallèle (Turbo)
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
API_URL ?= https://api.lumiris.eu
.PHONY: tauri-init tauri-dev tauri-build tauri-android-setup tauri-android-init tauri-android-dev tauri-android-build tauri-ios-init tauri-ios-dev
tauri-init: ## Initialise Tauri 2.0 dans apps/mobile (one-shot)
	@test ! -d "$(TAURI_DIR)" || { echo "[tauri-init] $(TAURI_DIR) existe déjà"; exit 1; }
	$(TAURI) init
	@echo "[tauri-init] OK · run 'make tauri-dev' pour démarrer"
tauri-dev: ## Mode dev Tauri (fenêtre native + Next dev sur 1420)
	@test -d "$(TAURI_DIR)" || { echo "[tauri-dev] lance d'abord 'make tauri-init'"; exit 1; }
	cd $(MOBILE_DIR) && env -u LD_LIBRARY_PATH -u GTK_PATH -u GIO_MODULE_DIR $(BUN) x @tauri-apps/cli@latest dev
tauri-build: ## Build Tauri release (export statique Next + binaires natifs)
	@test -d "$(TAURI_DIR)" || { echo "[tauri-build] lance d'abord 'make tauri-init'"; exit 1; }
	$(TAURI) build
tauri-android-setup: ## Installe les cibles Rust Android (SDK/NDK/JDK requis côté système)
	rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
tauri-android-init: ## Bootstrap target Android (NDK requis) → génère src-tauri/gen/android
	$(TAURI) android init
tauri-android-dev: ## Dev sur émulateur/device Android
	$(TAURI) android dev
tauri-android-build: ## Build l'APK Android release (API_URL=https://api.lumiris.eu par défaut)
	cd $(MOBILE_DIR) && NEXT_PUBLIC_API_BASE_URL=$(API_URL) $(BUN) x @tauri-apps/cli@latest android build --apk
	@echo "[tauri-android-build] APK → $(TAURI_DIR)/gen/android/app/build/outputs/apk/"
tauri-ios-init: ## Bootstrap target iOS (Xcode requis, macOS only)
	$(TAURI) ios init
tauri-ios-dev: ## Dev sur simulateur/device iOS
	$(TAURI) ios dev

##@ Maintenance
.PHONY: clean clean-all reset doctor
clean: ## Nettoie .next + .turbo + dist
	$(BUN) run clean
clean-all: ## Tout nettoyer (y compris node_modules)
	$(BUN) run clean:all
reset: clean-all install ## Reset complet (dernière chance)
doctor: ## Vérifie les versions des outils requis (front-only)
	@printf '\033[1;33m# Versions installées\033[0m\n'
	@printf "  bun         : "; bun --version 2>/dev/null || echo MISSING
	@printf "  node        : "; node --version 2>/dev/null || echo MISSING
	@printf "  rustc       : "; rustc --version 2>/dev/null || echo "(facultatif - requis pour Tauri)"
	@printf "  cargo       : "; cargo --version 2>/dev/null || echo "(facultatif - requis pour Tauri)"
	@printf "  git         : "; git --version 2>/dev/null || echo MISSING

##@ CI
.PHONY: ci
ci: install check build ## Pipeline CI exécuté localement (install + check + build)

##@ Release
.PHONY: release
release: ## Tag + push (VERSION=v0.1.0) — GitHub Actions construit, signe et pousse
	@test -n "$(VERSION)" || { echo "Usage: VERSION=v0.1.0 make release"; exit 1; }
	@echo "$(VERSION)" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9.-]+)?$$' \
	  || { echo "[release] version invalide (semver attendu, ex: v0.1.0)"; exit 1; }
	git tag -a $(VERSION) -m "release $(VERSION)"
	git push origin $(VERSION)
	@echo "[release] tag $(VERSION) poussé"
