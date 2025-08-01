# Makefile for MediMate
# Run 'make' or 'make help' to see all available commands

.PHONY: help
help: ## Show this help message
	@echo "MediMate - Available Commands:"
	@echo "========================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick Start: make setup && make dev"
	@echo "Mobile:      make ios (auto-configures simulator)"

# Environment setup
.PHONY: setup
setup: ## Initial project setup (run this first!)
	@echo "🚀 Setting up project..."
	@if [ ! -f .env.dev ]; then \
		echo "📝 Creating .env.dev from template..."; \
		cp .env.example .env.dev; \
		echo "⚠️  Please update .env.dev with your credentials!"; \
	fi
	@echo "📦 Installing dependencies..."
	@cd backend && npm install
	@cd packages/web && npm install
	@cd packages/mobile && npm install
	@cd packages/shared && npm install && npm run build
	@cd packages/components && npm install && npm run build
	@echo "✅ Setup complete!"

.PHONY: dev
dev: ## Start all services in development mode
	@echo "🚀 Starting development environment..."
	@if [ ! -f .env.dev ]; then \
		echo "❌ .env.dev not found! Run 'make setup' first"; \
		exit 1; \
	fi
	@docker-compose --env-file .env.dev up

.PHONY: up
up: dev-d ## Alias for dev-d (background mode)

.PHONY: dev-d
dev-d: ## Start all services in background (detached)
	@echo "🚀 Starting development environment (detached)..."
	@if [ ! -f .env.dev ]; then \
		echo "❌ .env.dev not found! Run 'make setup' first"; \
		exit 1; \
	fi
	@docker-compose --env-file .env.dev up -d
	@sleep 3
	@echo "✅ Services started!"
	@echo "   • Frontend: http://localhost:3000"
	@echo "   • Backend:  http://localhost:3001"
	@echo "   • Mobile:   Run 'make ios' or 'make android'"
	@echo ""
	@echo "Run 'make logs' to view logs"
	@echo "Run 'make status' to check status"

.PHONY: stop
stop: ## Stop all running services
	@echo "🛑 Stopping all services..."
	@docker-compose down

.PHONY: down
down: stop ## Alias for stop

.PHONY: restart
restart: stop dev ## Restart all services

.PHONY: rebuild
rebuild: ## Rebuild and start all services
	@echo "🔨 Rebuilding all services..."
	@if [ ! -f .env.dev ]; then \
		echo "❌ .env.dev not found! Run 'make setup' first"; \
		exit 1; \
	fi
	@docker-compose --env-file .env.dev up --build

.PHONY: status
status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker-compose ps
	@echo ""
	@make health

.PHONY: ps
ps: status ## Alias for status

.PHONY: health
health: ## Check health of all services
	@echo "🏥 Health Checks:"
	@curl -s http://localhost:3001/api/health >/dev/null 2>&1 && echo "✅ Backend: Healthy" || echo "❌ Backend: Not responding"
	@curl -s http://localhost:3000 >/dev/null 2>&1 && echo "✅ Frontend: Running" || echo "❌ Frontend: Not responding"
	@curl -s http://localhost >/dev/null 2>&1 && echo "✅ Nginx: Running" || echo "❌ Nginx: Not responding"

.PHONY: logs
logs: ## Show logs from all services
	@docker-compose logs -f

.PHONY: logs-backend
logs-backend: ## Show Backend logs only
	@docker-compose logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Show Frontend logs only
	@docker-compose logs -f frontend

.PHONY: logs-db
logs-db: ## Show MongoDB logs only
	@docker-compose logs -f database

.PHONY: clean
clean: stop ## Stop services and remove volumes (fresh start)
	@echo "🧹 Cleaning up volumes and containers..."
	@docker-compose down -v --remove-orphans
	@echo "✅ Cleanup complete!"

.PHONY: reset
reset: clean setup dev ## Full reset (clean + setup + dev)

# Development commands
.PHONY: backend
backend: ## Start only Backend service locally
	@echo "🚀 Starting Backend..."
	@if [ ! -f .env.dev ]; then \
		echo "❌ .env.dev not found! Run 'make setup' first"; \
		exit 1; \
	fi
	@if [ ! -f backend/.env ]; then \
		echo "📝 Creating backend/.env from .env.dev..."; \
		grep -E "^(NODE_ENV|PORT|MONGODB_URI|JWT_SECRET|FRONTEND_URL|REDIS_URL)" .env.dev > backend/.env; \
	fi
	@cd backend && npm run dev

.PHONY: frontend
frontend: ## Start only Frontend service locally
	@echo "🚀 Starting Frontend..."
	@if [ ! -f .env.dev ]; then \
		echo "❌ .env.dev not found! Run 'make setup' first"; \
		exit 1; \
	fi
	@if [ ! -f packages/web/.env ]; then \
		echo "📝 Creating packages/web/.env from .env.dev..."; \
		grep -E "^(REACT_APP_)" .env.dev > packages/web/.env; \
	fi
	@cd packages/web && npm start

.PHONY: mobile-metro
mobile-metro: ## Start React Native Metro bundler
	@echo "📱 Starting Metro bundler..."
	@cd packages/mobile && npm start

# Mobile commands
.PHONY: ios
ios: ## Run on iOS Simulator (iPhone 16)
	@echo "📱 Starting iOS app..."
	@if [ ! -f .env.dev ]; then \
		echo "❌ .env.dev not found! Run 'make setup' first"; \
		exit 1; \
	fi
	@if [ ! -f packages/mobile/.env ]; then \
		echo "📝 Creating packages/mobile/.env from .env.dev..."; \
		grep -E "^(API_URL_DEV|API_URL_PROD)" .env.dev > packages/mobile/.env; \
	fi
	@cd packages/mobile && npx react-native run-ios --simulator="iPhone 16"

.PHONY: android
android: ## Run on Android Emulator
	@echo "🤖 Starting Android app..."
	@if [ ! -f .env.dev ]; then \
		echo "❌ .env.dev not found! Run 'make setup' first"; \
		exit 1; \
	fi
	@if [ ! -f packages/mobile/.env ]; then \
		echo "📝 Creating packages/mobile/.env from .env.dev..."; \
		grep -E "^(API_URL_DEV|API_URL_PROD)" .env.dev > packages/mobile/.env; \
	fi
	@cd packages/mobile && npx react-native run-android

.PHONY: ios-device
ios-device: ## Run on physical iOS device
	@echo "📱 Running on physical iPhone..."
	@echo "📝 Make sure your device is connected and trusted"
	@cd packages/mobile && npx react-native run-ios --device

.PHONY: android-device
android-device: ## Run on physical Android device
	@echo "🤖 Running on physical Android device..."
	@echo "📝 Make sure USB debugging is enabled"
	@cd packages/mobile && npx react-native run-android

.PHONY: ios-clean
ios-clean: ## Clean iOS build
	@echo "🧹 Cleaning iOS build..."
	@cd packages/mobile/ios && xcodebuild clean -workspace mobile.xcworkspace -scheme mobile

.PHONY: ios-pods
ios-pods: ## Install iOS dependencies (CocoaPods)
	@echo "📱 Installing iOS dependencies..."
	@cd packages/mobile/ios && pod install

.PHONY: ios-rebuild
ios-rebuild: ios-clean ios-pods ios ## Clean and rebuild iOS app

.PHONY: android-clean
android-clean: ## Clean Android build
	@echo "🧹 Cleaning Android build..."
	@cd packages/mobile/android && ./gradlew clean

.PHONY: mobile-clean
mobile-clean: ## Clean React Native cache
	@echo "🧹 Cleaning React Native cache..."
	@cd packages/mobile && npx react-native-clean-project

# Testing commands
.PHONY: test
test: ## Run all tests
	@echo "🧪 Running tests..."
	@cd backend && npm test
	@cd packages/web && npm test -- --run
	@cd packages/mobile && npm test

.PHONY: test-backend
test-backend: ## Run Backend tests only
	@echo "🧪 Running Backend tests..."
	@cd backend && npm test

.PHONY: test-frontend
test-frontend: ## Run Frontend tests only
	@echo "🧪 Running Frontend tests..."
	@cd packages/web && npm test -- --run

.PHONY: test-mobile
test-mobile: ## Run Mobile tests only
	@echo "🧪 Running Mobile tests..."
	@cd packages/mobile && npm test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "👁️  Running tests in watch mode..."
	@echo "Choose: [1] Backend, [2] Frontend, [3] Mobile"
	@read choice; \
	if [ "$$choice" = "1" ]; then \
		cd backend && npm test -- --watch; \
	elif [ "$$choice" = "2" ]; then \
		cd packages/web && npm test; \
	elif [ "$$choice" = "3" ]; then \
		cd packages/mobile && npm test -- --watch; \
	fi

# Code quality
.PHONY: lint
lint: ## Run linters on all code
	@echo "🔍 Running linters..."
	@cd backend && npm run lint || true
	@cd packages/web && npm run lint || true
	@cd packages/mobile && npm run lint || true

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	@echo "🔍 Type checking..."
	@cd backend && npm run typecheck
	@cd packages/web && npm run typecheck
	@cd packages/mobile && npm run typecheck

# Database commands
.PHONY: db-shell
db-shell: ## Open MongoDB shell
	@docker-compose exec database mongosh -u admin -p adminpass medimate

.PHONY: db-seed
db-seed: ## Seed database with sample data
	@echo "🌱 Seeding database..."
	@docker-compose exec backend npm run seed

.PHONY: db-reset
db-reset: ## Reset database (drop all data)
	@echo "🗑️  Resetting database..."
	@docker-compose down -v database
	@docker-compose up -d database
	@echo "⏳ Waiting for database to start..."
	@sleep 5
	@echo "✅ Database reset complete!"

# Build commands
.PHONY: build
build: ## Build all projects
	@echo "📦 Building all projects..."
	@cd packages/shared && npm run build
	@cd backend && npm run build
	@cd packages/web && npm run build
	@echo "✅ Build complete!"

.PHONY: build-shared
build-shared: ## Build shared package
	@echo "📦 Building shared package..."
	@cd packages/shared && npm run build

.PHONY: build-backend
build-backend: ## Build Backend
	@echo "📦 Building Backend..."
	@cd backend && npm run build

.PHONY: build-frontend
build-frontend: ## Build Frontend
	@echo "📦 Building Frontend..."
	@cd packages/web && npm run build

.PHONY: build-mobile-ios
build-mobile-ios: ## Build iOS app
	@echo "📦 Building iOS app..."
	@cd packages/mobile && npx react-native build-ios

.PHONY: build-mobile-android
build-mobile-android: ## Build Android APK
	@echo "📦 Building Android APK..."
	@cd packages/mobile && cd android && ./gradlew assembleRelease

# Installation commands
.PHONY: install
install: ## Install all dependencies
	@echo "📦 Installing all dependencies..."
	@cd packages/shared && npm install
	@cd backend && npm install
	@cd packages/web && npm install
	@cd packages/mobile && npm install

.PHONY: install-backend
install-backend: ## Install Backend dependencies
	@echo "📦 Installing Backend dependencies..."
	@cd backend && npm install

.PHONY: install-frontend
install-frontend: ## Install Frontend dependencies
	@echo "📦 Installing Frontend dependencies..."
	@cd packages/web && npm install

.PHONY: install-mobile
install-mobile: ## Install Mobile dependencies
	@echo "📦 Installing Mobile dependencies..."
	@cd packages/mobile && npm install

.PHONY: install-shared
install-shared: ## Install Shared dependencies
	@echo "📦 Installing Shared dependencies..."
	@cd packages/shared && npm install

# Environment commands
.PHONY: env-check
env-check: ## Verify environment configuration
	@echo "🔍 Checking environment configuration..."
	@if [ ! -f backend/.env ]; then \
		echo "❌ backend/.env file not found!"; \
		exit 1; \
	fi
	@echo "✅ Environment files exist"

# Docker commands
.PHONY: docker-prune
docker-prune: ## Clean up Docker system
	@echo "🧹 Cleaning Docker system..."
	@docker system prune -f

.PHONY: docker-logs
docker-logs: logs ## Alias for logs

.PHONY: docker-up
docker-up: dev-d ## Alias for dev-d

.PHONY: docker-down
docker-down: stop ## Alias for stop

.PHONY: docker-restart
docker-restart: restart ## Alias for restart

# Utility commands
.PHONY: info
info: ## Show project information
	@echo "📁 Project Structure:"
	@echo "   • Backend:  Node.js + Express + MongoDB"
	@echo "   • Frontend: React + TypeScript + Tailwind"
	@echo "   • Mobile:   React Native + TypeScript"
	@echo "   • Shared:   Common types and utilities"
	@echo ""
	@echo "🔗 Local URLs:"
	@echo "   • Frontend: http://localhost:3000"
	@echo "   • Backend:  http://localhost:3001"
	@echo "   • Database: mongodb://localhost:27017"
	@echo ""
	@echo "📱 Mobile Development:"
	@echo "   • iOS:      make ios"
	@echo "   • Android:  make android"

.PHONY: quick
quick: setup dev ## Quick start (setup + dev)

# Git hooks
.PHONY: install-hooks
install-hooks: ## Install git hooks
	@echo "🪝 Installing git hooks..."
	@echo "#!/bin/sh\nmake typecheck" > .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✅ Git hooks installed!"

# Environment management
.PHONY: clean-env
clean-env: ## Remove all generated .env files (keeps .env.dev and .env.prod)
	@echo "🧹 Cleaning generated .env files..."
	@rm -f backend/.env packages/web/.env packages/mobile/.env
	@echo "✅ Cleaned generated env files"

.PHONY: prod
prod: ## Start services with production config (requires .env.prod)
	@echo "🚀 Starting production environment..."
	@if [ ! -f .env.prod ]; then \
		echo "❌ .env.prod not found! Create it from .env.example"; \
		exit 1; \
	fi
	@docker-compose --env-file .env.prod up -d

# Default target
.DEFAULT_GOAL := help