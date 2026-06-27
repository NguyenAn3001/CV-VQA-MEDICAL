# --- Build Stage ---
FROM python:3.10-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /install

# Copy only requirements to cache them in docker layer
COPY requirements.txt .

# Install dependencies into a localized folder. 
# We use --no-cache-dir to keep image small
RUN pip install --user --no-cache-dir -r requirements.txt


# --- Production Stage ---
FROM python:3.10-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Create a non-root user for security
RUN useradd --create-home appuser
USER appuser
WORKDIR /app

# Copy installed python dependencies from builder
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Copy application source code
COPY --chown=appuser:appuser ./app /app/app
COPY --chown=appuser:appuser ./models /app/models

# Default Environment Variables (Can be overridden by Docker run)
ENV PORT=8000
ENV DEVICE=cpu
# If using GPU, use an nvidia-cuda base image instead of python:3.10-slim

# Expose port
EXPOSE 8000

# Start Gunicorn with Uvicorn workers
CMD ["gunicorn", "app.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "120"]
