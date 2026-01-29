# ---------------------
# Base image with Node.js 24
# ---------------------
FROM public.ecr.aws/docker/library/node:24-trixie-slim AS base

# ---------------------
# Builder: install deps, build, prune dev deps
# ---------------------
FROM base AS builder
WORKDIR /app

# Install essentials for native builds (e.g., bcrypt) and curl for fetching RDS CA
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    curl \
    ca-certificates \
    git \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm (use a stable major compatible with lockfile)
RUN npm i -g pnpm@10

# Leverage caching: copy lockfile and manifest first
COPY pnpm-lock.yaml package.json ./

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the repo
COPY . .

# Build all apps (dist/*)
RUN pnpm run build:all

# Download RDS CA certificate bundle for SSL connections
RUN mkdir -p dist/libs/database/src && \
    curl -sS https://truststore.pki.rds.amazonaws.com/me-central-1/me-central-1-bundle.pem -o dist/libs/database/src/me-central-1-bundle.pem

# Prune devDependencies to reduce runtime image size
RUN CI=true HUSKY=0 pnpm prune --prod --ignore-scripts

# ---------------------
# Runtime: minimal, production deps only
# ---------------------
FROM base AS runner
WORKDIR /app

# Install pnpm for running the app
RUN npm i -g pnpm@10

# Copy production node_modules, build output, and manifest
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./.env

# Expose port for the user app
EXPOSE 3000

CMD ["pnpm", "run", "prod:user"]
