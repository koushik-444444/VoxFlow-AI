# Agentic Coding Guidelines for VoxFlow-AI

This document provides essential information for AI agents operating in the VoxFlow-AI repository.

## 🛠 Project Architecture
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Python FastAPI microservices (API Gateway, STT, LLM, TTS).
- **Redesign**: Custom "Gemini-inspired" UI with glassmorphism, ambient mesh backgrounds, and hierarchical typography.

## 🚀 Commands

### Frontend (Next.js/Vitest)
- **Install**: `cd frontend && npm install`
- **Build**: `cd frontend && npm run build`
- **Lint**: `cd frontend && npm run lint`
- **Type Check**: `cd frontend && npx tsc --noEmit`
- **Test (All)**: `cd frontend && npx vitest run`
- **Test (Single File)**: `cd frontend && npx vitest run path/to/file.test.ts`
- **Test (Watch)**: `cd frontend && npx vitest`

### Backend (Python/Pytest)
- **Test (All)**: `cd backend && python -m pytest tests/ -v`
- **Test (Single File)**: `cd backend && python -m pytest backend/tests/test_filename.py -v`
- **Test (Keyword)**: `cd backend && python -m pytest -k "test_name" -v`
- **Run (Docker)**: `docker compose up --build`

### Root (Makefile)
- `make help`: Show all available commands.
- `make test`: Run all tests (frontend + backend).
- `make type-check`: Run TypeScript validation.

## 🎨 Code Style Guidelines

### General
- **Formatting**: Use Prettier for JS/TS and Black for Python.
- **Naming**: 
  - `PascalCase` for React components and Types.
  - `camelCase` for variables, functions, and props.
  - `snake_case` for Python functions and variables.
  - `kebab-case` for CSS classes and filenames.

### Frontend (React/TypeScript)
- **Components**: Use functional components with `export function Name()`.
- **Imports**: 
  1. React/Next hooks.
  2. External libraries (Framer Motion, Lucide).
  3. Internal components (`@/components/...`).
  4. Stores/Hooks/Utils.
  5. Static assets/Styles.
- **Types**: Always define interfaces for component props. Prefer `interface` over `type`.
- **State**: Use `zustand` for global state. Keep component-level state local with `useState`.
- **Lucide Icons**: Use standard size `w-4 h-4` or `w-5 h-5`.

### Backend (FastAPI/Python)
- **Types**: Use Python type hints (Pydantic models for request/response).
- **Error Handling**: Use `ErrorHandlingMiddleware` for sanitizing exceptions. Return consistent JSON structures: `{"detail": "...", "type": "..."}`.
- **Logging**: Use `structlog` for structured logging.

### CSS & UI Redesign
- **Glassmorphism**: Use `.glass-panel`, `.glass-card`, or `.glass-input` utilities.
- **Typography**: 
  - **Main Title**: `text-4xl` or larger, bold, gradient text.
  - **Headers**: `h3` tags with `text-lg font-bold`.
  - **Captions**: Italicized text for statuses/small notes.
- **Colors**: Use `gemini-*` tokens defined in `tailwind.config.ts`.
- **Layout**: User messages must be on the **right** (`flex-row-reverse`), AI on the **left**.

## 🛡️ Security & Quality
- **CORS**: Strictly restricted to authorized origins (check `app/config.py`).
- **Validation**: Always validate user input using Pydantic or Zod-like patterns.
- **Secrets**: Never commit `.env` or sensitive keys. Use `.env.example` as a template.
- **Verified**: Always run `npm run build` and `npx tsc --noEmit` before committing frontend changes.
