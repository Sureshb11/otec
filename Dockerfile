# Multi-stage Dockerfile for Full Stack App (Backend + Frontend)
# This builds both frontend and backend, then serves frontend from NestJS

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ .

# Build frontend (production build)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCK_API=false

RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (use legacy-peer-deps to handle version conflicts)
RUN npm ci --legacy-peer-deps

# Copy backend source
COPY backend/ .

# Build backend
RUN npm run build

# Stage 3: Production - Combine Frontend + Backend
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install only production dependencies for backend (use legacy-peer-deps)
RUN npm ci --only=production --legacy-peer-deps

# Copy built backend from builder
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend from builder to public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]

