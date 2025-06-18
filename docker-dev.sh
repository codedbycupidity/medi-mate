#!/bin/bash

echo "🚀 Starting MediMate in Docker with Browser Sync..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build and start container
echo "🔨 Building container..."
docker-compose up --build

echo "✅ MediMate started!"
echo "🌐 Access your app: http://localhost:3000"
