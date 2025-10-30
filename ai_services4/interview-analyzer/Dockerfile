FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create virtual environment and install dependencies
RUN python -m venv whisper_venv
RUN . whisper_venv/bin/activate && pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/ || exit 1

# Start the service
CMD ["uvicorn", "whisper_service:app", "--host", "0.0.0.0", "--port", "8003"]
