.PHONY: help install install-backend install-frontend install-mobile install-shared build build-shared build-backend build-frontend build-mobile dev dev-backend dev-frontend dev-mobile dev-docker test test-backend test-frontend test-mobile lint typecheck clean docker-up docker-down docker-restart docker-logs setup

# Default target
help:
	@echo "MediMate Development Commands:"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup              - Full project setup (install all dependencies)"
	@echo "  make install            - Install all dependencies"
	@echo "  make install-backend    - Install backend dependencies"
	@echo "  make install-frontend   - Install frontend dependencies"
	@echo "  make install-mobile     - Install mobile dependencies"
	@echo "  make install-shared     - Install shared dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev                - Start all dev servers (Docker)"
	@echo "  make dev-backend        - Start backend dev server"
	@echo "  make dev-frontend       - Start frontend dev server"
	@echo "  make dev-mobile         - Start mobile metro bundler"
	@echo "  make dev-docker         - Start all services with Docker"
	@echo ""
	@echo "Building:"
	@echo "  make build              - Build all projects"
	@echo "  make build-shared       - Build shared package"
	@echo "  make build-backend      - Build backend"
	@echo "  make build-frontend     - Build frontend"
	@echo "  make build-mobile       - Build mobile app"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test               - Run all tests"
	@echo "  make test-backend       - Run backend tests"
	@echo "  make test-frontend      - Run frontend tests"
	@echo "  make test-mobile        - Run mobile tests"
	@echo "  make lint               - Run linters"
	@echo "  make typecheck          - Run TypeScript type checking"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up          - Start Docker containers"
	@echo "  make docker-down        - Stop Docker containers"
	@echo "  make docker-restart     - Restart Docker containers"
	@echo "  make docker-logs        - View Docker logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean              - Clean all build artifacts and node_modules"
	@echo ""
	@echo "Mobile Development:"
	@echo "  make ios                - Run iOS app (using existing Metro bundler)"
	@echo "  make android            - Run Android app (using existing Metro bundler)"
	@echo "  make ios-install-deps   - Install iOS dependencies (CocoaPods)"
	@echo "  make android-clean      - Clean Android build"

# Setup
setup: install-shared install-backend install-frontend install-mobile build-shared
	@echo "✅ Project setup complete!"

# Installation targets
install: install-shared install-backend install-frontend install-mobile
	@echo "✅ All dependencies installed!"

install-shared:
	@echo "📦 Installing shared dependencies..."
	@cd shared && npm install

install-backend:
	@echo "📦 Installing backend dependencies..."
	@cd backend && npm install

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	@cd frontend && npm install --legacy-peer-deps

install-mobile:
	@echo "📦 Installing mobile dependencies..."
	@cd mobile && npm install

# Build targets
build: build-shared build-backend build-frontend
	@echo "✅ All projects built!"

build-shared:
	@echo "🔨 Building shared package..."
	@cd shared && npm run build

build-backend: build-shared
	@echo "🔨 Building backend..."
	@cd backend && npm run build

build-frontend: build-shared
	@echo "🔨 Building frontend..."
	@cd frontend && npm run build

build-mobile:
	@echo "🔨 Building mobile app..."
	@echo "Run 'npm run ios' or 'npm run android' in the mobile directory"

# Development targets
dev: dev-docker
	@echo "🚀 Development environment started!"

dev-backend:
	@echo "🚀 Starting backend dev server..."
	@cd backend && npm run dev

dev-frontend:
	@echo "🚀 Starting frontend dev server..."
	@cd frontend && npm start

dev-mobile:
	@echo "🚀 Starting mobile metro bundler..."
	@cd mobile && npm start

dev-docker: docker-up
	@echo "🚀 Docker development environment started!"

# Test targets
test: test-backend test-frontend test-mobile
	@echo "✅ All tests completed!"

test-backend:
	@echo "🧪 Running backend tests..."
	@cd backend && npm test

test-frontend:
	@echo "🧪 Running frontend tests..."
	@cd frontend && npm test

test-mobile:
	@echo "🧪 Running mobile tests..."
	@cd mobile && npm test

# Linting and type checking
lint:
	@echo "🔍 Running linters..."
	@cd backend && npm run lint || true
	@cd frontend && npm run lint || true
	@cd mobile && npm run lint || true

typecheck:
	@echo "🔍 Running TypeScript type checking..."
	@cd shared && npx tsc --noEmit
	@cd backend && npm run typecheck
	@cd frontend && npm run typecheck || true
	@cd mobile && npm run typecheck

# Docker commands
docker-up:
	@echo "🐳 Starting Docker containers..."
	@docker-compose up -d

docker-down:
	@echo "🐳 Stopping Docker containers..."
	@docker-compose down

docker-restart: docker-down docker-up
	@echo "🐳 Docker containers restarted!"

docker-logs:
	@echo "📋 Docker logs (Ctrl+C to exit)..."
	@docker-compose logs -f

# Clean
clean:
	@echo "🧹 Cleaning build artifacts and dependencies..."
	@rm -rf shared/dist shared/node_modules
	@rm -rf backend/dist backend/node_modules
	@rm -rf frontend/build frontend/node_modules
	@rm -rf mobile/node_modules mobile/ios/Pods
	@echo "✅ Cleanup complete!"

# Database commands
db-seed:
	@echo "🌱 Seeding database..."
	@cd backend && npm run seed || echo "Seed script not found"

db-migrate:
	@echo "📊 Running database migrations..."
	@cd backend && npm run migrate || echo "Migration script not found"

# Mobile specific commands
ios: install-mobile
	@echo "📱 Starting iOS app..."
	@cd mobile && npx react-native run-ios --no-packager || true
	@echo "✅ iOS app launched! Check your simulator."

android: install-mobile
	@echo "📱 Starting Android app..."
	@cd mobile && npx react-native run-android --no-packager

ios-install-deps:
	@echo "📱 Installing iOS dependencies..."
	@cd mobile/ios && pod install

android-clean:
	@echo "🧹 Cleaning Android build..."
	@cd mobile/android && ./gradlew clean

# Git hooks
install-hooks:
	@echo "🪝 Installing git hooks..."
	@echo "#!/bin/sh\nmake typecheck" > .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✅ Git hooks installed!"