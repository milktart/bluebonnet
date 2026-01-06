# Multi-stage Dockerfile supporting multiple environments
#
# USAGE:
#   docker-compose up --build                    # Uses NODE_ENV from .env (default: development)
#   NODE_ENV=production docker-compose up --build # Explicitly set environment
#   NODE_ENV=test docker-compose up --build       # Use test environment
#
# AVAILABLE STAGES:
#   - development: Full dev environment with hot-reload, all dependencies
#   - production:  Optimized build, pruned dependencies, non-root user, health checks
#   - prod:        Alias for production (uses NODE_ENV=prod for database naming)
#   - test:        Testing environment with all dependencies (run tests: docker-compose run app npm test)
#
# ADDING CUSTOM STAGES:
#   To add a new stage (e.g., "staging"), copy an existing stage and modify:
#   1. Change: FROM node:20-alpine AS your-stage-name
#   2. Customize: ENV NODE_ENV, CMD, dependencies, etc.
#   3. Set NODE_ENV=your-stage-name in .env
#   4. Run: docker-compose up --build
#
ARG NODE_ENV=development

# ============================================================================
# Stage 1: Base - Common dependencies for all environments
# ============================================================================
FROM node:20-alpine AS base

WORKDIR /app

# Install build dependencies (needed for some npm packages) and git for version info
RUN apk add --no-cache python3 make g++ git

# Create non-root user for all build and runtime operations
# This ensures consistent file ownership across all environments (dev, test, prod)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app && \
    chown -R nodejs:nodejs /app

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# ============================================================================
# Stage 2: Development Dependencies
# ============================================================================
FROM base AS development-deps

# Install all dependencies as nodejs user to ensure proper ownership
USER nodejs
RUN npm install

# ============================================================================
# Stage 3: Production Dependencies
# ============================================================================
FROM base AS production-deps

# Install only production dependencies as nodejs user
# Skip prepare script (husky) since git is not available in Docker
USER nodejs
RUN npm ci --omit=dev --ignore-scripts && npm rebuild bcrypt 2>/dev/null || true

# ============================================================================
# Stage 4: Builder - Build assets
# ============================================================================
FROM base AS builder

# Install all dependencies for building as nodejs user
USER nodejs
RUN npm ci

# Copy source code with proper ownership
COPY --chown=nodejs:nodejs . .

# Capture build information (git commit, timestamp) and save to .build-info file
# This allows production builds to know the exact commit they were built from
RUN node scripts/capture-build-info.js > /tmp/build-info.txt && cat /tmp/build-info.txt && \
    cp /tmp/build-info.txt .build-info

# Build all assets (CSS and JavaScript)
RUN npm run build

# Build SvelteKit frontend (SSR with adapter-node)
WORKDIR /app/frontend
RUN npm ci
RUN npm run build

# ============================================================================
# Stage 5: Development - Full development environment
# ============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Install git for version info
RUN apk add --no-cache git

# Create non-root user (same as base stage) for consistent file ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Configure git to trust the /app directory (for volume mounts)
RUN git config --global --add safe.directory /app

# Copy all dependencies (including dev) with proper ownership
COPY --from=development-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy source code with proper ownership
COPY --chown=nodejs:nodejs . .

# Build JavaScript bundles as nodejs user (consistent with production)
USER nodejs
RUN npm run build-js

# Don't install or build frontend in Docker for development
# Let it be handled at runtime in docker-entrypoint.sh
# This avoids permission issues with Vite cache when npm runs as non-root

# Set environment
ENV NODE_ENV=development
ENV PORT=3000

# Expose port
EXPOSE 3000

# Copy and set entrypoint script (as root for permissions)
USER root
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run entrypoint as root (needed for permission fixes on volume mounts)
# Entrypoint will handle dropping to nodejs user for app startup
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# ============================================================================
# Stage 6: Test - Testing environment
# ============================================================================
FROM node:20-alpine AS test

WORKDIR /app

# Create non-root user (same as base stage) for consistent file ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Copy all dependencies (including dev for testing tools) with proper ownership
COPY --from=development-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy source code with proper ownership
COPY --chown=nodejs:nodejs . .

# Build JavaScript bundles as nodejs user (consistent with dev/prod)
USER nodejs
RUN npm run build-js

# Don't install or build frontend in Docker for test
# Let it be handled at runtime in docker-entrypoint.sh

# Set environment
ENV NODE_ENV=test
ENV PORT=3000

# Expose port
EXPOSE 3000

# Copy and set entrypoint script (as root for permissions)
USER root
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as nodejs user (same as production/development)
USER nodejs
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# ============================================================================
# Stage 7: Production - Optimized production image
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user (same as base stage) for consistent behavior
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Copy all dependencies with proper ownership
COPY --from=development-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code with proper ownership (exclude dev files via .dockerignore)
COPY --chown=nodejs:nodejs . .

# Build JavaScript bundles as nodejs user (consistent with dev/test)
USER nodejs
RUN npm run build-js

# Don't build frontend in Docker - let it be handled at runtime
# This ensures consistent behavior across all environments and avoids permission issues

# Create logs directory with proper permissions
USER root
RUN mkdir -p /app/logs && chmod -R 777 /app/logs

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy and set entrypoint script with proper permissions
USER root
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as nodejs user (consistent with dev/test)
USER nodejs
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]

# ============================================================================
# Stage 8: Prod - Alias for production (uses NODE_ENV=prod for database naming)
# ============================================================================
FROM node:20-alpine AS prod

WORKDIR /app

# Create non-root user (same as base stage) for consistent behavior
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Copy all dependencies with proper ownership
COPY --from=development-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code with proper ownership (exclude dev files via .dockerignore)
COPY --chown=nodejs:nodejs . .

# Build JavaScript bundles as nodejs user (consistent with dev/test)
USER nodejs
RUN npm run build-js

# Don't build frontend in Docker - let it be handled at runtime
# This ensures consistent behavior across all environments and avoids permission issues
# Production will still benefit from pre-built frontend in the entrypoint

# Create logs directory with proper permissions
USER root
RUN mkdir -p /app/logs && chmod -R 777 /app/logs

# Set prod environment (will be overridden by NODE_ENV env var at runtime)
ENV NODE_ENV=prod
ENV PORT=3000

# Copy and set entrypoint script with proper permissions
USER root
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as nodejs user (consistent with dev/test)
USER nodejs
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
