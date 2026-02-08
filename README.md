---
title: VoxFlow AI
emoji: 🎙️
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
---

# VoxFlow AI 🎙️⚡

A high-performance, real-time speech-to-speech AI platform optimized for Hugging Face Spaces (Backend) and Vercel (Frontend).

## 🚀 Features
- **Real-time Voice Chat**: Low-latency WebSocket-based audio streaming.
- **Cloud Powered**: Optimized with Groq (STT/LLM) and Edge-TTS for lightning-fast, free-tier performance.
- **Monolith Architecture**: Single container running Gateway, STT, LLM, and TTS services.

## 🛠 Deployment Guide

### Backend (Hugging Face)
1. Create a new **Docker** Space on Hugging Face.
2. Upload this repository.
3. Add the following **Secrets** in Settings:
   - `GROQ_API_KEY`: Your key from Groq Cloud.
   - `REDIS_URL`: Your REST URL from Upstash Redis.
4. Add the following **Variables** in Settings:
   - `STT_PROVIDER`: `groq`
   - `LLM_PROVIDER`: `groq`
   - `PROVIDER`: `edge-tts`

### Frontend (Vercel)
1. Import this repository to Vercel.
2. Set the **Root Directory** to `frontend`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your HF Space URL (https).
   - `NEXT_PUBLIC_WS_URL`: Your HF Space URL (wss).

---
*This Space runs a FastAPI monolith managed by supervisord.*
