FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip and install build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy and install consolidated requirements
COPY requirements_all.txt .
RUN pip install --no-cache-dir -r requirements_all.txt

# Copy backend services
COPY api-gateway/ api-gateway/
COPY stt-service/ stt-service/
COPY llm-service/ llm-service/
COPY tts-service/ tts-service/
COPY supervisord.conf .

# Hugging Face Spaces port
EXPOSE 7860

# Run all services via supervisord
CMD ["supervisord", "-c", "supervisord.conf"]
