# Docker Deployment Guide for Prayas

This guide explains how to deploy the Prayas application using Docker containers.

## Quick Start

### 1. Production Deployment

```bash
# Clone and navigate to project
cd prayas

# Copy environment template
cp .env.docker .env

# Edit .env with your actual API keys
nano .env

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f app
```

Your application will be available at `http://localhost:80`

### 2. Development with Hot Reloading

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Check logs
docker-compose -f docker-compose.dev.yml logs -f app-dev
```

Development server available at `http://localhost:5001`

## Architecture

### Services Overview

1. **PostgreSQL Database** (`postgres`)
   - Port: 5432 (internal), 5432 (external)
   - Data persistence with Docker volumes
   - Health checks and auto-initialization

2. **Redis Cache** (`redis`)
   - Port: 6379
   - Session storage and caching
   - Optional but recommended for production

3. **Main Application** (`app`)
   - Port: 5000
   - Node.js backend + React frontend
   - Handles all API requests and serves static files

4. **Nginx Reverse Proxy** (`nginx`)
   - Ports: 80 (HTTP), 443 (HTTPS)
   - Load balancing, SSL termination, static file serving
   - Rate limiting and security headers

### Directory Structure

```
prayas/
├── Dockerfile                 # Production container
├── Dockerfile.dev            # Development container  
├── docker-compose.yml        # Production orchestration
├── docker-compose.dev.yml    # Development orchestration
├── nginx.conf                # Nginx configuration
├── init-db.sql              # Database initialization
├── .env.docker              # Environment template
└── .dockerignore            # Docker ignore rules
```

## Configuration

### Environment Variables

Copy `.env.docker` to `.env` and configure:

#### Required Variables

```bash
# Database
DATABASE_URL=postgresql://prayas_user:prayas_password@postgres:5432/prayas_db

# Application
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Payment Gateways (get from respective dashboards)
STRIPE_SECRET_KEY=sk_test_or_sk_live_your_stripe_key
VITE_STRIPE_PUBLIC_KEY=pk_test_or_pk_live_your_stripe_key
RAZORPAY_KEY_ID=rzp_test_or_rzp_live_your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Email Service
SENDGRID_API_KEY=SG.your_sendgrid_api_key
```

#### Optional Variables

```bash
# Redis (for better session management)
REDIS_URL=redis://redis:6379

# Domain Configuration
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Webhook Secrets
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Commands

### Docker Compose Commands

```bash
# Production
docker-compose up -d              # Start all services in background
docker-compose down               # Stop all services
docker-compose logs -f app        # View application logs
docker-compose restart app        # Restart application
docker-compose exec app sh        # Access application container

# Development
docker-compose -f docker-compose.dev.yml up --build
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f app-dev

# Database operations
docker-compose exec postgres psql -U prayas_user -d prayas_db
docker-compose exec app npm run db:push
```

### Docker Commands

```bash
# Build application image
docker build -t prayas-app .

# Run standalone container
docker run -d \
  --name prayas-app \
  -p 5000:5000 \
  -e DATABASE_URL=your_database_url \
  -e SESSION_SECRET=your_session_secret \
  prayas-app

# View logs
docker logs -f prayas-app

# Execute commands in container
docker exec -it prayas-app sh
docker exec -it prayas-app npm run db:push
```

## Health Checks

The application includes built-in health monitoring:

- **Application Health**: `http://localhost/api/health`
- **Database Health**: Automated via Docker health checks
- **Redis Health**: Automated via Docker health checks

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-07-31T16:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 67108864,
    "heapTotal": 20971520,
    "heapUsed": 18874368,
    "external": 1089024
  },
  "environment": "production"
}
```

## Data Persistence

### Volumes

- `postgres_data`: Database files
- `redis_data`: Redis data files  
- `app_uploads`: User uploaded files
- `app_logs`: Application log files

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U prayas_user prayas_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U prayas_user prayas_db < backup.sql
```

## Production Deployment

### 1. Server Setup

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. SSL Configuration

For HTTPS in production:

1. Get SSL certificates (Let's Encrypt recommended)
2. Place certificates in `./ssl/` directory
3. Uncomment HTTPS server block in `nginx.conf`
4. Update `ALLOWED_ORIGINS` in `.env`

### 3. Monitoring and Logs

```bash
# Monitor resource usage
docker stats

# View all logs
docker-compose logs

# Monitor specific service
docker-compose logs -f --tail=100 app

# Log rotation (add to crontab)
docker system prune -af --volumes
```

### 4. Security Considerations

- Change all default passwords in `.env`
- Use strong `SESSION_SECRET` (32+ characters)
- Configure firewall to only allow ports 80, 443, 22
- Regularly update Docker images
- Monitor logs for suspicious activity
- Use production API keys for payment gateways

### 5. Scaling

For high traffic, consider:

```bash
# Scale application containers
docker-compose up -d --scale app=3

# Use external managed database
# Update DATABASE_URL to point to managed PostgreSQL

# Use external Redis cluster
# Update REDIS_URL to point to managed Redis
```

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check database status
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**Application Won't Start**
```bash
# Check application logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep DATABASE_URL

# Rebuild application
docker-compose build --no-cache app
docker-compose up -d app
```

**High Memory Usage**
```bash
# Monitor containers
docker stats

# Clean up unused resources
docker system prune -af
docker volume prune
```

### Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all required API keys are configured
4. Check firewall and network connectivity
5. Verify Docker and Docker Compose versions

### Performance Tuning

For production optimization:

1. **Database**: Configure PostgreSQL settings for your server specs
2. **Node.js**: Adjust `--max-old-space-size` for memory optimization  
3. **Nginx**: Enable caching and compression
4. **Docker**: Limit container resources with `--memory` and `--cpus`

This Docker setup provides a production-ready, scalable deployment of your Prayas application with proper database persistence, caching, reverse proxy, and monitoring capabilities.