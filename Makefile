.PHONY: help dev dev-down dev-logs frontend backend test test-frontend test-backend \
       build lint type-check clean

# ── Help ─────────────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Development ──────────────────────────────────────────────
dev: ## Start all backend services with docker-compose
	docker compose up --build

dev-down: ## Stop all backend services
	docker compose down

dev-logs: ## Tail logs for all services
	docker compose logs -f

frontend: ## Start frontend dev server
	cd frontend && npm run dev

backend: ## Start all services via supervisord (monolith mode)
	cd backend && supervisord -c supervisord.conf

# ── Testing ──────────────────────────────────────────────────
test: test-frontend test-backend ## Run all tests

test-frontend: ## Run frontend tests
	cd frontend && npx vitest run

test-backend: ## Run backend tests
	cd backend && python -m pytest tests/ -v --tb=short

# ── Quality ──────────────────────────────────────────────────
type-check: ## Run TypeScript type checking
	cd frontend && npx tsc --noEmit

lint: type-check ## Run all linters (currently type-check only)

build: ## Build frontend for production
	cd frontend && npm run build

# ── Cleanup ──────────────────────────────────────────────────
clean: ## Remove build artifacts and caches
	rm -rf frontend/.next frontend/node_modules/.cache
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
