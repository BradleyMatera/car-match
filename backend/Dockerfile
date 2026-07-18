# syntax=docker/dockerfile:1
# Car Match backend — containerized Express app for Google Cloud Run.
# Cloud Run injects PORT (default 8080); server.js already listens on process.env.PORT.
FROM node:18-slim

# Build toolchain in case bcrypt's prebuilt binary is unavailable for this arch.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install production deps first (better layer caching).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source.
COPY . .

# Runtime config. PORT is also provided by Cloud Run at runtime.
ENV NODE_ENV=production
ENV PORT=8080
ENV LOG_TO_CONSOLE=true
ENV LOG_DIR=/tmp/logs

EXPOSE 8080

CMD ["node", "server.js"]
