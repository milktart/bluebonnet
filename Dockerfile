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

# Copy package files
COPY package*.json ./

# ============================================================================
# Stage 2: Development Dependencies
# ============================================================================
FROM base AS development-deps

# Install all dependencies (including devDependencies)
RUN npm install

# ============================================================================
# Stage 3: Production Dependencies
# ============================================================================
FROM base AS production-deps

# Install only production dependencies
# Skip prepare script (husky) since git is not available in Docker
RUN npm ci --omit=dev --ignore-scripts && npm rebuild bcrypt 2>/dev/null || true

# ============================================================================
# Stage 4: Builder - Build assets
# ============================================================================
FROM base AS builder

# Install all dependencies for building
RUN npm ci

# Copy source code
COPY . .

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

# Configure git to trust the /app directory (for volume mounts)
RUN git config --global --add safe.directory /app

# Copy all dependencies (including dev)
COPY --from=development-deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build JavaScript bundles (lighter than full build)
RUN npm run build-js

# Set environment
ENV NODE_ENV=development
ENV PORT=3000

# Expose port
EXPOSE 3000

# Copy and set entrypoint script
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as root in development for flexibility (volume mounts, etc.)
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# ============================================================================
# Stage 6: Test - Testing environment
# ============================================================================
FROM node:20-alpine AS test

WORKDIR /app

# Copy all dependencies (including dev for testing tools)
COPY --from=development-deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build JavaScript bundles
RUN npm run build-js

# Set environment
ENV NODE_ENV=test
ENV PORT=3000

# Expose port
EXPOSE 3000

# Copy and set entrypoint script
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run dev server by default (run tests with: docker-compose run app npm test)
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# ============================================================================
# Stage 7: Production - Optimized production image
# ============================================================================
FROM node:20-alpine AS production

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy only production dependencies
COPY --from=production-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built assets from builder
COPY --from=builder --chown=nodejs:nodejs /app/public/dist ./public/dist
COPY --from=builder --chown=nodejs:nodejs /app/public/css/style.css ./public/css/style.css

# Copy build info file for version tracking
COPY --from=builder --chown=nodejs:nodejs /app/.build-info ./.build-info

# Copy application code (exclude dev files via .dockerignore)
COPY --chown=nodejs:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs && chmod -R 777 /app/logs

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy and set entrypoint script with proper permissions (before switching user)
COPY --chown=nodejs:nodejs scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Use non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]

# ============================================================================
# Stage 8: Prod - Alias for production (uses NODE_ENV=prod for database naming)
# ============================================================================
FROM node:20-alpine AS prod

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy only production dependencies
COPY --from=production-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built assets from builder
COPY --from=builder --chown=nodejs:nodejs /app/public/dist ./public/dist
COPY --from=builder --chown=nodejs:nodejs /app/public/css/style.css ./public/css/style.css

# Copy build info file for version tracking
COPY --from=builder --chown=nodejs:nodejs /app/.build-info ./.build-info

# Copy application code (exclude dev files via .dockerignore)
COPY --chown=nodejs:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs && chmod -R 777 /app/logs

# Set prod environment (will be overridden by NODE_ENV env var at runtime)
ENV NODE_ENV=prod
ENV PORT=3000

# Copy and set entrypoint script with proper permissions (before switching user)
COPY --chown=nodejs:nodejs scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Use non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
