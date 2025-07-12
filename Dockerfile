FROM denoland/deno:latest

# Install curl for health checks
USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy configuration files
COPY deno.json .
COPY .env.example .env

# Copy source code
COPY src/ src/
COPY main.ts .

# Cache dependencies
RUN deno cache main.ts

# Create non-root user
RUN groupadd -r denouser && useradd -r -g denouser denouser
RUN chown -R denouser:denouser /app
USER denouser

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3333/health || exit 1

# Start the application
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]