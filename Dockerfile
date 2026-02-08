FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install consolidated requirements
COPY requirements_all.txt .
RUN pip install --no-cache-dir -r requirements_all.txt

# Copy all services
COPY api-gateway/ api-gateway/
COPY stt-service/ stt-service/
COPY llm-service/ llm-service/
COPY tts-service/ tts-service/
COPY supervisord.conf .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Hugging Face Spaces port
EXPOSE 7860

# Run all services via supervisord
CMD ["supervisord", "-c", "supervisord.conf"]
