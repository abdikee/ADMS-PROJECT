#!/bin/bash

# SAMS Deployment Script
# This script handles deployment to different environments

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_DIR="$PROJECT_ROOT/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
SAMS Deployment Script

Usage: $0 [ENVIRONMENT] [OPTIONS]

Environments:
  staging     Deploy to staging environment
  production  Deploy to production environment
  local       Deploy to local environment

Options:
  --backup     Create backup before deployment
  --migrate    Run database migrations
  --seed       Seed database with initial data
  --rollback   Rollback to previous version
  --dry-run    Show what would be done without executing
  --help       Show this help message

Examples:
  $0 staging --backup --migrate
  $0 production --backup
  $0 local --migrate --seed
  $0 production --rollback

EOF
}

# Parse arguments
ENVIRONMENT=""
BACKUP=false
MIGRATE=false
SEED=false
ROLLBACK=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        staging|production|local)
            ENVIRONMENT="$1"
            shift
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        --migrate)
            MIGRATE=true
            shift
            ;;
        --seed)
            SEED=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    error "Environment is required. Use staging, production, or local."
    show_help
    exit 1
fi

# Set environment-specific variables
case $ENVIRONMENT in
    staging)
        ENV_FILE="$PROJECT_ROOT/backend/config/staging.env"
        DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.staging.yml"
        ;;
    production)
        ENV_FILE="$PROJECT_ROOT/backend/config/production.env"
        DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.production.yml"
        ;;
    local)
        ENV_FILE="$PROJECT_ROOT/backend/config/development.env"
        DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
        ;;
esac

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    error "Environment file not found: $ENV_FILE"
    exit 1
fi

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Function to run command with dry-run support
run_command() {
    local cmd="$1"
    local description="$2"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would execute: $cmd"
        log "DRY RUN: $description"
        return 0
    else
        log "Executing: $description"
        eval "$cmd"
        return $?
    fi
}

# Function to check service health
check_health() {
    local service_url="$1"
    local max_attempts=30
    local attempt=1
    
    log "Checking service health: $service_url"
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$service_url/health" > /dev/null; then
            success "Service is healthy after $attempt attempts"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: Service not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    error "Service health check failed after $max_attempts attempts"
    return 1
}

# Function to create backup
create_backup() {
    if [[ "$BACKUP" != true ]]; then
        return 0
    fi
    
    log "Creating backup before deployment..."
    
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    run_command "mkdir -p '$backup_path'" "Creating backup directory"
    
    # Database backup
    run_command "cd '$PROJECT_ROOT/backend' && node scripts/backup.js database" "Creating database backup"
    
    # Files backup
    run_command "cd '$PROJECT_ROOT/backend' && node scripts/backup.js files" "Creating files backup"
    
    success "Backup completed: $backup_name"
}

# Function to run database migrations
run_migrations() {
    if [[ "$MIGRATE" != true ]]; then
        return 0
    fi
    
    log "Running database migrations..."
    
    run_command "cd '$PROJECT_ROOT/backend' && node scripts/migrate.js up" "Running database migrations"
    
    success "Database migrations completed"
}

# Function to seed database
seed_database() {
    if [[ "$SEED" != true ]]; then
        return 0
    fi
    
    log "Seeding database..."
    
    run_command "cd '$PROJECT_ROOT/backend' && node scripts/seed.js" "Seeding database"
    
    success "Database seeding completed"
}

# Function to rollback deployment
rollback_deployment() {
    if [[ "$ROLLBACK" != true ]]; then
        return 0
    fi
    
    log "Rolling back deployment..."
    
    # Get latest backup
    local latest_backup=$(ls -t "$BACKUP_DIR" | head -n 1)
    
    if [[ -z "$latest_backup" ]]; then
        error "No backup found for rollback"
        return 1
    fi
    
    run_command "cd '$PROJECT_ROOT/backend' && node scripts/backup.js restore '$latest_backup'" "Rolling back to backup: $latest_backup"
    
    success "Rollback completed"
}

# Function to build and deploy
deploy_application() {
    log "Deploying to $ENVIRONMENT environment..."
    
    # Load environment variables
    if [[ "$DRY_RUN" != true ]]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi
    
    # Build application
    run_command "cd '$PROJECT_ROOT' && npm run build" "Building frontend application"
    
    # Build Docker image
    local image_name="sams-app:$ENVIRONMENT"
    run_command "cd '$PROJECT_ROOT' && docker build -t '$image_name' ." "Building Docker image"
    
    # Deploy with Docker Compose
    if [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        run_command "cd '$PROJECT_ROOT' && docker-compose -f '$DOCKER_COMPOSE_FILE' up -d" "Starting services with Docker Compose"
    else
        run_command "cd '$PROJECT_ROOT' && docker-compose up -d" "Starting services with Docker Compose"
    fi
    
    # Wait for services to be ready
    sleep 30
    
    # Check health
    local service_port=${PORT:-5000}
    check_health "http://localhost:$service_port"
    
    success "Deployment to $ENVIRONMENT completed successfully"
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    log "Running post-deployment tests..."
    
    # Health check
    run_command "curl -f 'http://localhost:${PORT:-5000}/health'" "Health check"
    
    # API tests
    run_command "cd '$PROJECT_ROOT/backend' && npm test" "Running API tests"
    
    # Security scan
    run_command "cd '$PROJECT_ROOT' && npm audit --audit-level high" "Running security audit"
    
    success "Post-deployment tests completed"
}

# Main deployment flow
main() {
    log "Starting deployment to $ENVIRONMENT environment..."
    
    # Pre-deployment checks
    if [[ "$DRY_RUN" != true ]]; then
        # Check if required services are running
        if ! docker --version > /dev/null 2>&1; then
            error "Docker is not installed or not running"
            exit 1
        fi
        
        # Check if we have enough disk space
        local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
        local required_space=1048576  # 1GB in KB
        
        if [[ $available_space -lt $required_space ]]; then
            error "Insufficient disk space for deployment"
            exit 1
        fi
    fi
    
    # Create backup
    create_backup
    
    # Rollback if requested
    if [[ "$ROLLBACK" == true ]]; then
        rollback_deployment
        exit 0
    fi
    
    # Deploy application
    deploy_application
    
    # Run migrations
    run_migrations
    
    # Seed database
    seed_database
    
    # Run post-deployment tests
    run_post_deployment_tests
    
    # Cleanup old backups (keep last 10)
    if [[ "$DRY_RUN" != true ]]; then
        log "Cleaning up old backups..."
        cd "$BACKUP_DIR" && ls -t | tail -n +11 | xargs -r rm -rf
    fi
    
    success "Deployment to $ENVIRONMENT completed successfully!"
    
    # Show deployment summary
    cat << EOF

Deployment Summary:
==================
Environment: $ENVIRONMENT
Timestamp: $(date)
Backup Created: $BACKUP
Migrations Run: $MIGRATE
Database Seeded: $SEED
Tests Passed: Yes

Next Steps:
- Monitor application logs: tail -f $LOG_DIR/combined-$(date +%Y-%m-%d).log
- Check service health: curl http://localhost:${PORT:-5000}/health
- View API docs: http://localhost:${PORT:-5000}/api-docs

EOF
}

# Trap cleanup
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main
