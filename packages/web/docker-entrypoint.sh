#!/bin/sh

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
fi

# Build components if needed
if [ -d "/components" ]; then
  cd /components
  if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
  fi
  npm run build
  cd /app
fi

# Start the application
npm start