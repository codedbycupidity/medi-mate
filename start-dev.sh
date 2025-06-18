#!/bin/bash

echo "🚀 Starting MediMate Multi-Service Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build and start all services
echo "🔨 Building and starting all services..."
docker-compose up --build

echo "✅ MediMate started!"
echo ""
echo "🌐 Access points:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  Nginx Proxy: http://localhost:80"
echo "  Database: localhost:5432"
echo "  Redis: localhost:6379"
