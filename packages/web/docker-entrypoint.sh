#!/bin/sh

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
fi

# Start the application
npm start