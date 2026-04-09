# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Install dependencies for frontend
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./backend/node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY backend/ ./backend/
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sams

# Copy built frontend
COPY --from=builder --chown=sams:nodejs /app/dist ./dist

# Copy backend dependencies and source
COPY --from=deps --chown=sams:nodejs /app/node_modules ./backend/node_modules
COPY --from=builder --chown=sams:nodejs /app/backend ./backend

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/backups && \
    chown -R sams:nodejs /app/logs /app/uploads /app/backups

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Switch to non-root user
USER sams

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "backend/server.js"]
