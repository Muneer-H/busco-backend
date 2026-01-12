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
# Prune devDependencies to reduce runtime image size
RUN HUSKY=0 pnpm prune --prod --ignore-scripts

# ---------------------
# Runtime: minimal, production deps only
# ---------------------
FROM base AS runner
WORKDIR /app

# Install tools needed to fetch secrets at runtime and pm2
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    jq \
    awscli \
  && rm -rf /var/lib/apt/lists/* \
  && npm i -g pm2

# Copy production node_modules, build output, and manifest
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker_entrypoint.sh ./docker_entrypoint.sh
RUN chmod +x ./docker_entrypoint.sh

# Expose ports for all apps
EXPOSE 3000 3004

ENTRYPOINT ["/app/docker_entrypoint.sh"]
