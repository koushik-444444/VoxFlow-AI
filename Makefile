# Speech-to-Speech AI Platform - Makefile

.PHONY: help install dev build up down logs test clean

# Default target
help:
	@echo "Speech-to-Speech AI Platform"
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install dependencies for all services"
	@echo "  make dev        - Start all services in development mode"
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start all services with Docker Compose"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - View service logs"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Clean up generated files"
	@echo "  make format     - Format code"
	@echo "  make lint       - Run linters"

# Installation
install:
	@echo "Installing Python dependencies..."
	cd api-gateway && pip install -r requirements.txt
	cd stt-service && pip install -r requirements.txt
	cd llm-service && pip install -r requirements.txt
	cd tts-service && pip install -r requirements.txt
	@echo "Installing Node dependencies..."
	cd frontend && npm install

# Development
dev:
	@echo "Starting development servers..."
	@echo "Make sure Redis is running: docker run -d -p 6379:6379 redis:7-alpine"
	@make dev-gateway &
	@make dev-stt &
	@make dev-llm &
	@make dev-tts &
	@make dev-frontend &
	@wait

dev-gateway:
	cd api-gateway && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

dev-stt:
	cd stt-service && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

dev-llm:
	cd llm-service && uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload

dev-tts:
	cd tts-service && uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload

dev-frontend:
	cd frontend && npm run dev

# Docker
build:
	docker build -t speech-ai-monolith -f Dockerfile .

up:
	docker run -p 7860:7860 --env-file .env speech-ai-monolith

down:
	@echo "Stop the container manually or use 'docker stop'"

logs:
	docker-compose logs -f

logs-gateway:
	docker-compose logs -f api-gateway

logs-stt:
	docker-compose logs -f stt-service

logs-llm:
	docker-compose logs -f llm-service

logs-tts:
	docker-compose logs -f tts-service

# Testing
test:
	@echo "Running backend tests..."
	cd api-gateway && pytest -v
	cd stt-service && pytest -v
	cd llm-service && pytest -v
	cd tts-service && pytest -v
	@echo "Running frontend tests..."
	cd frontend && npm test

test-gateway:
	cd api-gateway && pytest -v

test-frontend:
	cd frontend && npm test

# Code quality
format:
	@echo "Formatting Python code..."
	black api-gateway/ stt-service/ llm-service/ tts-service/ shared/ --line-length 100
	@echo "Formatting TypeScript code..."
	cd frontend && npm run format

lint:
	@echo "Linting Python code..."
	flake8 api-gateway/ stt-service/ llm-service/ tts-service/ --max-line-length 100
	@echo "Linting TypeScript code..."
	cd frontend && npm run lint

# Cleanup
clean:
	@echo "Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .coverage -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name dist -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name build -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleanup complete!"

# Database
redis:
	docker run -d --name speech-ai-redis -p 6379:6379 redis:7-alpine

redis-cli:
	docker exec -it speech-ai-redis redis-cli

redis-stop:
	docker stop speech-ai-redis && docker rm speech-ai-redis

# Utilities
health:
	@curl -s http://localhost:8000/health | python -m json.tool

health-stt:
	@curl -s http://localhost:8001/health | python -m json.tool

health-llm:
	@curl -s http://localhost:8002/health | python -m json.tool

health-tts:
	@curl -s http://localhost:8003/health | python -m json.tool

# Deployment
deploy-staging:
	@echo "Deploying to staging..."
	docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

deploy-production:
	@echo "Deploying to production..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Documentation
docs:
	@echo "Generating documentation..."
	cd api-gateway && python -m pdoc app -o ../docs/api

# Model management
download-models:
	@echo "Downloading ML models..."
	cd stt-service && python -c "import whisper; whisper.load_model('base')"
	cd tts-service && python -c "from TTS.api import TTS; TTS('tts_models/en/ljspeech/tacotron2-DDC')"
