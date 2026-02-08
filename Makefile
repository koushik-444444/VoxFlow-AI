# VoxFlow AI - Makefile

.PHONY: help install dev build up down test clean format lint

# Default target
help:
	@echo "VoxFlow AI"
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install dependencies for all services"
	@echo "  make dev        - Start all services in development mode"
	@echo "  make build      - Build backend Docker image"
	@echo "  make up         - Run backend Docker container locally"
	@echo "  make test       - Run tests"
	@echo "  make format     - Format code"
	@echo "  make lint       - Run linters"

# Installation
install:
	@echo "Installing backend dependencies..."
	pip install -r backend/requirements_all.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development
dev:
	@echo "Starting development servers..."
	@make dev-backend &
	@make dev-frontend &
	@wait

dev-backend:
	@echo "Starting backend monolith via supervisord..."
	supervisord -c backend/supervisord.conf

dev-frontend:
	cd frontend && npm run dev

# Docker
build:
	docker build -t voxflow-backend -f Dockerfile .

up:
	docker run -p 7860:7860 --env-file .env voxflow-backend

# Testing
test:
	@echo "Running backend tests..."
	pytest backend/api-gateway backend/stt-service backend/llm-service backend/tts-service
	@echo "Running frontend tests..."
	cd frontend && npm test

# Code quality
format:
	@echo "Formatting Python code..."
	black backend/ --line-length 100
	@echo "Formatting TypeScript code..."
	cd frontend && npm run format

lint:
	@echo "Linting Python code..."
	flake8 backend/ --max-line-length 100
	@echo "Linting TypeScript code..."
	cd frontend && npm run lint

# Cleanup
clean:
	@echo "Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleanup complete!"

# Database
redis:
	docker run -d --name voxflow-redis -p 6379:6379 redis:7-alpine

redis-stop:
	docker stop voxflow-redis && docker rm voxflow-redis
