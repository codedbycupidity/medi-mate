#!/bin/bash

case $1 in
  "start")
    echo "🚀 Starting MediMate..."
    docker-compose up --build
    ;;
  "stop")
    echo "🛑 Stopping MediMate..."
    docker-compose down
    ;;
  "restart")
    echo "🔄 Restarting MediMate..."
    docker-compose restart
    ;;
  "logs")
    echo "📋 Showing logs..."
    docker-compose logs -f
    ;;
  "shell")
    echo "🐚 Opening shell in container..."
    docker-compose exec medimate sh
    ;;
  "clean")
    echo "🧹 Cleaning up Docker..."
    docker-compose down
    docker system prune -f
    ;;
  *)
    echo "MediMate Docker Commands:"
    echo "  ./docker-commands.sh start    - Start the app"
    echo "  ./docker-commands.sh stop     - Stop the app"
    echo "  ./docker-commands.sh restart  - Restart the app"
    echo "  ./docker-commands.sh logs     - Show logs"
    echo "  ./docker-commands.sh shell    - Open shell"
    echo "  ./docker-commands.sh clean    - Clean up Docker"
    ;;
esac
