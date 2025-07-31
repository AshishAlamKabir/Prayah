#!/bin/bash

# Prayas Docker Deployment Script
# This script handles production deployment with proper checks and rollback

set -e

echo "🚀 Starting Prayas Docker Deployment..."

# Configuration
PROJECT_NAME="prayas"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed!"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        log_warn ".env file not found. Creating from template..."
        cp .env.docker .env
        log_warn "Please edit .env with your actual configuration before continuing."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    
    mkdir -p $BACKUP_DIR
    
    # Backup database if running
    if docker-compose ps postgres | grep -q "Up"; then
        log_info "Backing up database..."
        docker-compose exec -T postgres pg_dump -U prayas_user prayas_db > "$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
        log_info "Database backup created: $BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
    fi
    
    # Backup uploaded files
    if [ -d "uploads" ]; then
        log_info "Backing up uploaded files..."
        tar -czf "$BACKUP_DIR/uploads_backup_${TIMESTAMP}.tar.gz" uploads/
        log_info "Uploads backup created: $BACKUP_DIR/uploads_backup_${TIMESTAMP}.tar.gz"
    fi
}

# Deploy application
deploy() {
    log_info "Starting deployment..."
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose pull
    
    # Build and start services
    log_info "Building and starting services..."
    docker-compose up -d --build
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check health
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost/api/health > /dev/null 2>&1; then
            log_info "Application is healthy ✓"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Application failed to become healthy after $max_attempts attempts"
            return 1
        fi
        
        log_info "Waiting for application... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose exec app npm run db:push
    
    log_info "Deployment completed successfully ✓"
}

# Rollback function
rollback() {
    log_warn "Rolling back deployment..."
    
    # Stop current containers
    docker-compose down
    
    # Find latest backup
    local latest_db_backup=$(ls -t $BACKUP_DIR/db_backup_*.sql 2>/dev/null | head -n1)
    local latest_uploads_backup=$(ls -t $BACKUP_DIR/uploads_backup_*.tar.gz 2>/dev/null | head -n1)
    
    if [ ! -z "$latest_db_backup" ]; then
        log_info "Restoring database from: $latest_db_backup"
        docker-compose up -d postgres
        sleep 10
        docker-compose exec -T postgres psql -U prayas_user prayas_db < "$latest_db_backup"
    fi
    
    if [ ! -z "$latest_uploads_backup" ]; then
        log_info "Restoring uploads from: $latest_uploads_backup"
        rm -rf uploads/
        tar -xzf "$latest_uploads_backup"
    fi
    
    log_info "Rollback completed"
}

# Cleanup old backups
cleanup_backups() {
    log_info "Cleaning up old backups (keeping last 5)..."
    
    # Keep only last 5 database backups
    ls -t $BACKUP_DIR/db_backup_*.sql 2>/dev/null | tail -n +6 | xargs -r rm
    
    # Keep only last 5 upload backups
    ls -t $BACKUP_DIR/uploads_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
    
    log_info "Backup cleanup completed"
}

# Main deployment process
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_backup
            if deploy; then
                cleanup_backups
                log_info "🎉 Deployment successful!"
                log_info "Application is running at: http://localhost"
                log_info "Health check: http://localhost/api/health"
            else
                log_error "Deployment failed!"
                read -p "Do you want to rollback? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    rollback
                fi
                exit 1
            fi
            ;;
        "rollback")
            rollback
            ;;
        "backup")
            create_backup
            ;;
        "health")
            if curl -f http://localhost/api/health; then
                log_info "Application is healthy ✓"
            else
                log_error "Application health check failed ✗"
                exit 1
            fi
            ;;
        "logs")
            docker-compose logs -f app
            ;;
        "status")
            docker-compose ps
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|backup|health|logs|status}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy application (default)"
            echo "  rollback - Rollback to previous backup"
            echo "  backup   - Create backup only"
            echo "  health   - Check application health"
            echo "  logs     - View application logs"
            echo "  status   - Show container status"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"