# AGENTS.md - Development Guide for AI Agents

This repository is a Speech-to-Speech AI platform designed to run as a monolith container (via supervisord) on Hugging Face Spaces and Vercel.

## 🛠 Build, Lint, and Test Commands

### General
- **Full Setup**: `make install`
- **Build Monolith**: `make build`
- **Run Monolith**: `make up`

### Backend (Python - FastAPI)
The project runs 4 services in one container via `backend/supervisord.conf`: `api-gateway` (port 7860), `stt-service` (8001), `llm-service` (8002), `tts-service` (8003).
- **Lint**: `flake8 backend/[service-dir] --max-line-length 100`
- **Format**: `black backend/ --line-length 100`
- **Run Tests**: `pytest backend/[service-dir]`
- **Add Dependency**: Add to `backend/requirements_all.txt`


### Frontend (Next.js - TypeScript)
- **Install**: `npm install`
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`

---

## 🎨 Code Style & Conventions

### Python (Backend)
- **Version**: Python 3.10+
- **Async**: Use `async`/`await` for all I/O and service methods.
- **Engines**: 
  - **STT**: Groq Whisper API (Cloud)
  - **LLM**: Groq Llama 3 (Cloud)
  - **TTS**: Edge-TTS (Cloud)
- **Logging**: Use `structlog`. Avoid `print()`.
- **Typing**: Mandatory type hints for all function arguments and return types.

### TypeScript (Frontend)
- **Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS.
- **State**: Zustand (`frontend/store/useStore.ts`).
- **Icons**: Lucide React.

---

## 🏗 Architecture Principles

- **Monolith Container**: All backend services run in one container using `backend/supervisord.conf`.
- **Statelessness**: Services are stateless. Use **Upstash Redis** for session data.
- **Environment**: Configuration via environment variables in `backend/api-gateway/app/config.py`, etc.

## 📝 Commit Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/).

---

## 🔍 Search & Exploration Tips

- Review `backend/supervisord.conf` to see how services are started.
- Review `backend/api-gateway/app/main.py` for central routing.
- Check `backend/api-gateway/app/services/service_registry.py` for internal service URLs.

---

*This file is intended for AI agents to understand the project structure and standards. Adhere strictly to these rules when modifying the codebase.*
