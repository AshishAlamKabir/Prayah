#!/bin/bash

# Prayas Development Docker Script
# Quick commands for development workflow

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

case "${1:-help}" in
    "start")
        log_info "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    
    "stop")
        log_info "Stopping development environment..."
        docker-compose -f docker-compose.dev.yml down
        ;;
    
    "restart")
        log_info "Restarting development environment..."
        docker-compose -f docker-compose.dev.yml restart
        ;;
    
    "logs")
        docker-compose -f docker-compose.dev.yml logs -f "${2:-app-dev}"
        ;;
    
    "shell")
        docker-compose -f docker-compose.dev.yml exec app-dev sh
        ;;
    
    "db")
        docker-compose -f docker-compose.dev.yml exec postgres psql -U prayas_dev_user -d prayas_dev_db
        ;;
    
    "migrate")
        log_info "Running database migrations..."
        docker-compose -f docker-compose.dev.yml exec app-dev npm run db:push
        ;;
    
    "build")
        log_info "Building development containers..."
        docker-compose -f docker-compose.dev.yml build --no-cache
        ;;
    
    "clean")
        log_info "Cleaning up development environment..."
        docker-compose -f docker-compose.dev.yml down -v
        docker system prune -f
        ;;
    
    "status")
        docker-compose -f docker-compose.dev.yml ps
        ;;
    
    *)
        echo "Prayas Development Docker Commands"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  start    - Start development environment"
        echo "  stop     - Stop development environment"
        echo "  restart  - Restart development environment"
        echo "  logs     - View logs (optional: specify service)"
        echo "  shell    - Access development container shell"
        echo "  db       - Access PostgreSQL database"
        echo "  migrate  - Run database migrations"
        echo "  build    - Rebuild containers"
        echo "  clean    - Clean up containers and volumes"
        echo "  status   - Show container status"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs app-dev"
        echo "  $0 shell"
        ;;
esac