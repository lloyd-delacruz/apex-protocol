# ─── Apex Protocol Backend — Dockerfile ──────────────────────────────────────
# Build context must be the monorepo root:
#   docker build -f backend/Dockerfile -t apex-backend .

FROM node:20-alpine AS base

WORKDIR /app

# ── Dependency install layer ──────────────────────────────────────────────────
# Copy workspace manifests first so this layer is cached until deps change
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/

RUN npm install

# ── Source copy ───────────────────────────────────────────────────────────────
COPY packages/shared/ ./packages/shared/
COPY backend/ ./backend/

# Generate Prisma client
WORKDIR /app/backend
RUN npx prisma generate

EXPOSE 4000

# Default: run the dev server (hot-reload via ts-node-dev)
CMD ["npm", "run", "dev"]
