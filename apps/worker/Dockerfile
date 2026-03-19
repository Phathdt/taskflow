# =============================================================================
# Stage 1: Builder - Build the worker application
# =============================================================================
FROM node:24-alpine3.23 AS builder
WORKDIR /app

# Install build dependencies
RUN apk update && apk add --no-cache gcc g++ musl-dev git curl python3 make

# Copy package files for dependency installation
COPY package.json yarn.lock ./
COPY apps/worker/package.json ./apps/worker/

# Install ALL dependencies (including dev) for building
RUN yarn install --frozen-lockfile

# Copy source code and configuration
COPY . .

# Build worker
RUN yarn turbo build:prod --filter=@apps/worker

# =============================================================================
# Stage 2: Deps - Install production dependencies
# =============================================================================
FROM node:24-alpine3.23 AS deps
WORKDIR /app

# Copy worker package.json for production deps
COPY apps/worker/package.json ./package.json
COPY yarn.lock ./

# Install production dependencies only
# @temporalio/worker has native Rust bindings that need build tools
RUN apk add --no-cache python3 make gcc g++ musl-dev && \
  yarn install --production && \
  yarn cache clean && \
  apk del python3 make gcc g++ musl-dev

# =============================================================================
# Stage 3: Runtime - Final minimal image
# =============================================================================
FROM node:24-alpine3.23
WORKDIR /app

# Install only essential runtime packages
RUN apk add --no-cache dumb-init curl

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist/apps/worker ./dist/apps/worker

# Copy entrypoint script
COPY apps/worker/run.sh ./run.sh
RUN chmod +x /app/run.sh

ENTRYPOINT ["dumb-init", "sh", "/app/run.sh"]
