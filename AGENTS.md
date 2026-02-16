# Agentic Coding Guidelines for VoxFlow-AI

Essential reference for AI agents operating in this Speech-to-Speech AI repository.

## 🏗️ Project Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Python FastAPI microservices behind an API Gateway:
  - `api-gateway` (7860) -- Routing, WebSocket, Session Management, Middleware.
  - `stt-service` (8001) -- Speech-to-Text via Groq Whisper.
  - `llm-service` (8002) -- LLM processing via Groq Llama 3.
  - `tts-service` (8003) -- Text-to-Speech via Edge-TTS.
- **Infrastructure**: supervisord (monolith container), Upstash Redis (sessions).

## 🛠️ Commands

### Frontend (run from `frontend/`)
| Task | Command |
|------|---------|
| Install | `npm install` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Single test file | `npx vitest run tests/store.test.ts` |
| Test by name | `npx vitest run -t "pattern"` |

### Backend (run from `backend/`)
| Task | Command |
|------|---------|
| Install | `pip install -r requirements_all.txt` |
| All tests | `python -m pytest tests/` |
| Single test file | `python -m pytest tests/test_config.py` |
| Test by keyword | `python -m pytest -k "test_name"` |

## 🎨 Code Style & Conventions

### General Naming
- `PascalCase`: React components, TypeScript interfaces, Python classes.
- `camelCase`: JS/TS variables, functions, props, hooks.
- `snake_case`: Python functions, variables, modules.
- `kebab-case`: CSS classes, non-TSX filenames.

### Frontend (React/TypeScript)
- **Imports**: Group imports: 1. React/Next, 2. External, 3. Internal, 4. Hooks/Store, 5. Utils. Use `@/` alias.
- **Components**: Functional only. Use named exports (`export function X`).
- **Types**: Always use `interface` for props. Strict typing required (avoid `any`).
- **State**: Zustand at `store/useStore.ts` for global state. `useState` for local UI state.
- **Styling**: Tailwind CSS exclusively. Follow Gemini dark theme tokens.

### Backend (FastAPI/Python)
- **Async**: Use `async`/`await` for all I/O and service calls.
- **Typing**: Mandatory type hints for all parameters and returns.
- **Validation**: Pydantic v2 models for all request/response schemas.
- **Config**: `BaseSettings` via `pydantic-settings`.
- **Error Handling**: Use `ErrorHandlingMiddleware`. Return `{"detail": "...", "type": "..."}`.
- **Logging**: Use `structlog` for structured events.

### 🔄 CI/CD & Deployment
- GitHub Actions syncs `main` to Hugging Face Spaces.
- Vercel deploys `frontend/` directory.
- `Dockerfile` in root builds the backend monolith.

### 📝 Quality Standards
- No secrets in code. Use `.env.example` as a reference.
- Run `npm run lint` and `npx tsc --noEmit` before pushing.
- All new features must include unit tests in `tests/` directories.

---
*This file is for AI agents. Adhere strictly to these patterns to maintain codebase consistency.*
