# --- Build frontend ---
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Build backend ---
FROM node:20-slim AS backend-build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime ---
FROM mcr.microsoft.com/playwright:v1.50.1-noble

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/src/server.js"]
