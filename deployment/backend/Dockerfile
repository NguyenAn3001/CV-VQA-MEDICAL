FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.prod.txt .

# Install CPU-only PyTorch (saves ~2GB vs default CUDA build)
RUN pip install --no-cache-dir -r requirements.prod.txt

COPY . .

RUN mkdir -p models

COPY deployment/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
