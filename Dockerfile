# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install yarn (comes with node, just ensure it's available)
RUN corepack enable

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json yarn.lock ./

# Install ALL dependencies (including devDependencies needed for build)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the NestJS application
RUN yarn build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy package manifests
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

# Run the application
CMD ["node", "dist/main"]
