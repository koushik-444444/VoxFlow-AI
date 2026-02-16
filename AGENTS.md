# Agentic Coding Guidelines for VoxFlow-AI

Essential reference for AI agents operating in this Speech-to-Speech AI repository. This document ensures consistency across the microservices architecture and the React-based frontend.

## 🏗️ Project Architecture

VoxFlow-AI is a high-performance speech platform optimized for sub-second latency and smooth user experience.
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Four Python FastAPI microservices running in a partitioned monolith:
  - `api-gateway` (7860): The central entry point. Handles Routing, WebSockets, Session Management, and Middleware.
  - `stt-service` (8001): High-speed Speech-to-Text via Groq Whisper API.
  - `llm-service` (8002): Intelligent responses via LangChain + Groq Llama 3 (70B/8B).
  - `tts-service` (8003): Natural-sounding Text-to-Speech via Edge-TTS.
- **Infrastructure**: supervisord manages processes in production; Upstash Redis handles session persistence.

## 🛠️ Commands

### Frontend Development (run from `frontend/`)
| Task | Command |
|------|---------|
| Install Dependencies | `npm install` (uses `--legacy-peer-deps` via `.npmrc`) |
| Start Dev Server | `npm run dev` |
| Production Build | `npm run build` |
| Linting Check | `npm run lint` |
| Type Validation | `npx tsc --noEmit` |
| Run All Tests | `npx vitest run` |
| Run Single Test File | `npx vitest run tests/store.test.ts` |
| Run Tests by Pattern | `npx vitest run -t "PatternName"` |
| Watch Mode Tests | `npx vitest` |

### Backend Development (run from `backend/`)
| Task | Command |
|------|---------|
| Install Dependencies | `pip install -r requirements_all.txt` |
| Run All Tests | `python -m pytest tests/` |
| Single Test File | `python -m pytest tests/test_config.py` |
| Test by Keyword | `python -m pytest -k "test_name_pattern"` |
| Run with Coverage | `pytest --cov=app tests/` |
| Linting | `flake8 . --max-line-length 100` |
| Formatting | `black . --line-length 100` |

## 🎨 Code Style & Conventions

### General Naming Rules
- **React Components**: Always use `PascalCase` (e.g., `VoiceOrb.tsx`, `ChatMessage.tsx`).
- **Interfaces & Types**: `PascalCase` with descriptive names (e.g., `interface UserProfile`).
- **Python Classes**: `PascalCase` (e.g., `class LLMEngine`).
- **Functions & Variables**: `camelCase` for JavaScript/TypeScript, `snake_case` for Python.
- **Constants**: `UPPER_SNAKE_CASE` for both languages.
- **Filenames**: `PascalCase` for React components; `kebab-case` for utility files and CSS.

### Frontend (React/TypeScript)
- **Import Grouping**: Maintain a clean import order:
  1. React and Next.js core modules.
  2. Third-party libraries (e.g., `framer-motion`, `lucide-react`).
  3. Absolute path aliases (`@/components/...`, `@/lib/...`).
  4. State management and hooks (`@/store/useStore`).
  5. Scoped styles, types, and constants.
- **Component Design**: Favor functional components. Use named exports to improve grep-ability and refactoring.
- **TypeScript Usage**: strict mode is mandatory. Define interfaces for all props. Avoid the `any` type; use `unknown` if a type is truly dynamic, then narrow it down.
- **State Management**: Zustand handles global state. Use component-level `useState` only for transient UI states (like "is open" or "hovered").

### Backend (FastAPI/Python)
- **Async First**: All I/O operations must be `async`. Use `httpx.AsyncClient` for all internal service-to-service communication.
- **Data Modeling**: All requests and responses must use Pydantic v2 models. Use `Field` for descriptions and validation.
- **Configuration**: Use `BaseSettings` from `pydantic-settings`. Never hardcode secrets.
- **Error Handling**: Use the centralized `ErrorHandlingMiddleware` in the API Gateway. Raise `HTTPException` with clear detail messages.
- **Logging**: Use `structlog` for all events. Include `request_id` or `session_id` in logs for traceability.

### 🔄 CI/CD & Deployment
- **Hugging Face Hub**: The backend is synchronized via GitHub Actions. It runs as a Docker monolith.
- **Vercel**: The frontend is deployed here. It requires `NEXT_PUBLIC_API_URL` to point to the HF Space.
- **Docker**: The root `Dockerfile` is optimized for production. Use `Dockerfile.dev` for local testing.

### 📝 Quality Standards
- **Pre-commit**: Before pushing, run `npm run lint` and `pytest`.
- **Testing**: New features must include unit tests. Use mocks for external APIs (Groq, Redis) during testing.
- **Security**: Audit `.env.example` regularly. Ensure no sensitive keys are ever tracked.

### 🎙️ Speech Pipeline Flow
1. **Frontend**: Captures audio chunks via `MediaRecorder` in `useAudioRecorder.ts`.
2. **WebSocket**: Sends binary chunks to `api-gateway/app/routers/websocket.py`.
3. **Gateway**: Accumulates chunks until silence or manual stop, then forwards to `stt-service`.
4. **STT**: Transcribes using Groq Whisper and returns text to Gateway.
5. **LLM**: Gateway sends text to `llm-service`, which generates a response via Llama 3.
6. **TTS**: Response text is sent to `tts-service` for audio synthesis via Edge-TTS.
7. **Frontend**: Receives audio URL/data and plays it back.

### 🎨 Visual Identity: The AI Orb
The central "AI Orb" (`WaveformVisualizer.tsx`) is a core UX element:
- It uses **Framer Motion** and **CSS Filters** (blur, organic shapes).
- It reacts to the `audioLevel` state in the Zustand store.
- Animations are throttled to 30fps to maintain performance on lower-end devices.
- Colors follow the Gemini-inspired palette: `#4b90ff` (Blue) and `#d0bcff` (Purple).

### 🐛 Error Handling Examples

#### Python (Backend)
```python
try:
    response = await client.post(url, json=payload)
    response.raise_for_status()
except httpx.HTTPStatusError as e:
    logger.error("service_call_failed", error=str(e), status=e.response.status_code)
    raise HTTPException(status_code=500, detail="Service unavailable")
```

#### TypeScript (Frontend)
```typescript
try {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('API failed');
  const data = await res.json();
} catch (err) {
  console.error('Fetch error:', err);
  toast.error('Failed to connect to backend');
}
```

### 💅 Styling Guidelines
- **Tailwind**: Use utility classes for everything. Avoid writing raw CSS unless necessary for complex keyframes.
- **Glassmorphism**: Use the `.glass` utility for panels. It provides the standard backdrop-blur and border.
- **Responsiveness**: Use `md:`, `lg:` prefixes to ensure the UI works on mobile. Note that the Gemini UI layout relies on a centered `max-w-3xl` container.
- **Themes**: Support the `dark` class. Colors are defined in `globals.css` using CSS variables (HSL).

---
*No custom Cursor or Copilot rules are currently defined. Adhere to these guidelines as the primary source of truth.*
