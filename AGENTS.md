# Agentic Coding Guidelines for VoxFlow-AI

Essential reference for AI agents operating in this Speech-to-Speech AI repository.

## Project Architecture

- **Frontend**: Next.js 14 (App Router) with TypeScript, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Four Python FastAPI microservices behind an API Gateway:
  - `api-gateway` (port 8000) -- routes, WebSocket, session management, middleware.
  - `stt-service` (port 8001) -- speech-to-text via Groq Whisper.
  - `llm-service` (port 8002) -- LLM responses via LangChain + Groq.
  - `tts-service` (port 8003) -- text-to-speech via Edge-TTS.
- **Infrastructure**: Docker Compose (dev), supervisord (prod on HF Spaces), Redis for sessions.

## Commands

### Frontend (run from `frontend/`)
| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| All tests | `npx vitest run` |
| Single test file | `npx vitest run tests/store.test.ts` |
| Test by name | `npx vitest run -t "test name pattern"` |
| Watch mode | `npx vitest` |

### Backend (run from `backend/`)
| Task | Command |
|------|---------|
| Install deps | `pip install -r requirements_all.txt` |
| All tests | `python -m pytest tests/ -v --tb=short` |
| Single test file | `python -m pytest tests/test_config.py -v` |
| Test by keyword | `python -m pytest -k "test_name" -v` |
| Test (verbose) | `python -m pytest tests/ -v --tb=long` |

### Root Makefile
| Target | Description |
|--------|-------------|
| `make test` | Run all frontend + backend tests |
| `make test-frontend` | Frontend tests only |
| `make test-backend` | Backend tests only |
| `make type-check` | TypeScript validation |
| `make build` | Production frontend build |
| `make dev` | `docker compose up --build` |
| `make clean` | Remove caches (`.next`, `__pycache__`, `.pytest_cache`) |

### Pre-commit Checklist
Always run before committing frontend changes:
1. `cd frontend && npx tsc --noEmit`
2. `cd frontend && npm run build`
3. `cd frontend && npx vitest run`

## Code Style Guidelines

### General Naming
- `PascalCase` -- React components, TypeScript interfaces/types, Python classes.
- `camelCase` -- JS/TS variables, functions, props, hooks.
- `snake_case` -- Python functions, variables, module names.
- `kebab-case` -- CSS classes, filenames (e.g., `audio-recorder.ts`).

### Frontend (React/TypeScript)

**Components**: Functional components with named exports (`export function Name()`). No default exports for components.

**Import order** (group with blank lines):
1. React/Next.js (`'react'`, `'next/...'`)
2. External libraries (`'framer-motion'`, `'lucide-react'`)
3. Internal components (`'@/components/...'`)
4. Stores and hooks (`'@/store/useStore'`, `'@/hooks/...'`)
5. Utilities (`'@/lib/utils'`)

**Types**: Define `interface` for component props (prefer `interface` over `type`). TypeScript strict mode is enabled.

**Path aliases**: Use `@/` to reference the `frontend/` root (configured in `tsconfig.json`).

**State management**: Zustand store at `store/useStore.ts` for global state (session, conversations, audio, WebSocket, settings, UI). Use local `useState` for component-level state only.

**Icons**: Lucide React icons at `w-4 h-4` or `w-5 h-5`.

**Testing**: Vitest + React Testing Library + jsdom. Tests live in `frontend/tests/`. Setup file imports `@testing-library/jest-dom/vitest`. Use `describe`/`it` blocks.

### Backend (FastAPI/Python)

**Python version**: 3.10+ (type hints required everywhere).

**Type hints**: Use Pydantic v2 models for all request/response schemas. Use `pydantic-settings` for config (`BaseSettings`).

**Input validation**: Pydantic field validators with `@field_validator`. Key limits:
- `MAX_MESSAGES = 50`, `MAX_MESSAGE_CONTENT_LENGTH = 10000` (LLM)
- `MAX_TTS_TEXT_LENGTH = 5000`, speed `0.25-4.0` (TTS)
- Temperature `0.0-2.0`, max_tokens `1-8192` (LLM)

**Error handling**: `ErrorHandlingMiddleware` in `api-gateway/app/middleware.py` sanitizes all exceptions. Return consistent JSON: `{"detail": "...", "type": "..."}`.

**Logging**: Use `structlog` for structured logging.

**Async**: All route handlers and service calls are `async`. Pytest uses `asyncio_mode = "auto"` (in `pyproject.toml`).

**Testing**: pytest + pytest-asyncio. Tests in `backend/tests/`. The `conftest.py` adds all four service directories to `sys.path`. Use mock/fake clients (e.g., `FakeRedisClient`) instead of real services.

**Service imports**: Each microservice is independent. The `conftest.py` patches `sys.path` with:
- `backend/api-gateway`
- `backend/stt-service`
- `backend/llm-service`
- `backend/tts-service`

### CSS & UI Design System

**Theme**: Dark-first "Gemini-inspired" glassmorphism UI. `darkMode: ['class']` in Tailwind config.

**Custom color tokens** (use these, not raw hex):
- `gemini-bg`, `gemini-surface`, `gemini-hover`, `gemini-border`
- `gemini-blue` (#4b90ff), `gemini-purple` (#d0bcff), `gemini-violet`, `gemini-pink`
- `gemini-text`, `gemini-text-secondary`, `gemini-muted`
- `vox-purple` (#ac1ed6), `vox-rose`, `vox-black`, `vox-gray`, `vox-light`

**Glass utilities**: `.glass-panel`, `.glass-card`, `.glass-input` (defined in `globals.css`).

**Typography**:
- Main titles: `text-4xl`+, bold, gradient text.
- Section headers: `<h3>` with `text-lg font-bold`.
- Captions/status: italicized.

**Font**: Outfit (`var(--font-outfit)`), loaded in `layout.tsx`.

**Layout**: Chat messages -- user on the **right** (`flex-row-reverse`), AI on the **left**.

**Animations**: Custom keyframes available: `pulse-glow`, `wave`, `float`, `glow-breathe`, `accordion-down/up`.

## Key Files

| Purpose | Path |
|---------|------|
| Zustand store | `frontend/store/useStore.ts` |
| Global CSS + glass utilities | `frontend/app/globals.css` |
| Tailwind tokens | `frontend/tailwind.config.ts` |
| Main page layout | `frontend/app/page.tsx` |
| WebSocket handler | `backend/api-gateway/app/routers/websocket.py` |
| API Gateway config | `backend/api-gateway/app/config.py` |
| Middleware stack | `backend/api-gateway/app/middleware.py` |
| Backend test fixtures | `backend/tests/conftest.py` |
| CI pipeline | `.github/workflows/ci.yml` |

## CI/CD

GitHub Actions CI (`.github/workflows/ci.yml`) runs on push/PR to `main`:
- **Frontend job**: Node 20 -- type-check, vitest, build.
- **Backend job**: Python 3.11 -- install deps, pytest.
- **HF Sync**: After CI passes, force-pushes to Hugging Face Spaces.

## Security & Quality
- **CORS**: Restricted to authorized origins (see `api-gateway/app/config.py`).
- **Secrets**: Never commit `.env`. Use `.env.example` as a template (114-line reference).
- **Rate limiting**: `RateLimitMiddleware` in API Gateway with sliding window.
- **Validation**: All user input validated via Pydantic (backend) or TypeScript types (frontend).
