#!/bin/bash

case $1 in
  "start")
    echo "🚀 Starting all services..."
    docker-compose up --build
    ;;
  "stop")
    echo "🛑 Stopping all services..."
    docker-compose down
    ;;
  "restart")
    echo "🔄 Restarting all services..."
    docker-compose restart
    ;;
  "logs")
    service=${2:-}
    if [ -z "$service" ]; then
      echo "📋 Showing logs for all services..."
      docker-compose logs -f
    else
      echo "📋 Showing logs for $service..."
      docker-compose logs -f $service
    fi
    ;;
  "shell")
    service=${2:-backend}
    echo "🐚 Opening shell in $service..."
    docker-compose exec $service sh
    ;;
  "reset")
    echo "🗑️  Resetting database and volumes..."
    docker-compose down -v
    ;;
  "build")
    service=${2:-}
    if [ -z "$service" ]; then
      echo "🔨 Rebuilding all services..."
      docker-compose build
    else
      echo "🔨 Rebuilding $service..."
      docker-compose build $service
    fi
    ;;
  *)
    echo "MediMate Service Commands:"
    echo ""
    echo "  ./services.sh start              - Start all services"
    echo "  ./services.sh stop               - Stop all services"
    echo "  ./services.sh restart            - Restart all services"
    echo "  ./services.sh logs [service]     - Show logs"
    echo "  ./services.sh shell [service]    - Open shell in service"
    echo "  ./services.sh reset              - Reset database"
    echo "  ./services.sh build [service]    - Rebuild service(s)"
    echo ""
    echo "Available services: frontend, backend, database, redis, nginx"
    ;;
esac
