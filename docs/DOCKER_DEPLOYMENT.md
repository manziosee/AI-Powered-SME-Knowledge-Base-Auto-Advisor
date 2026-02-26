# Docker Deployment Guide

## Quick Start (Development)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your credentials
nano .env

# 3. Start all services
make docker-up

# 4. Check health
make docker-health

# 5. Run migrations
docker-compose exec backend alembic upgrade head

# 6. Access services
# API: http://localhost:8000/api/v1/docs
# Flower: http://localhost:5555
```

## Production Deployment

```bash
# 1. Use production compose file
make docker-prod

# 2. Or manually
docker-compose -f docker-compose.prod.yml up -d

# 3. Setup SSL (optional)
mkdir ssl
# Add your SSL certificates to ssl/
```

## Docker Commands

```bash
# Start services
make docker-up

# Stop services
make docker-down

# View logs
make docker-logs

# Check health
make docker-health

# Rebuild containers
make docker-rebuild

# Production deployment
make docker-prod
```

## Service Management

### Restart Individual Service
```bash
docker-compose restart backend
docker-compose restart celery_worker
docker-compose restart postgres
```

### View Service Logs
```bash
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f postgres
```

### Execute Commands in Container
```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Access PostgreSQL
docker-compose exec postgres psql -U sme_user -d sme_kb

# Access Redis CLI
docker-compose exec redis redis-cli

# Python shell
docker-compose exec backend python
```

## Troubleshooting

### Services Not Starting
```bash
# Check logs
docker-compose logs

# Rebuild containers
make docker-rebuild
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres pg_isready -U sme_user
```

### Celery Not Processing
```bash
# Check worker logs
docker-compose logs celery_worker

# Restart worker
docker-compose restart celery_worker
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml
# Or stop conflicting services
sudo lsof -i :8000
sudo kill -9 <PID>
```

## Environment Variables

Required in `.env`:
```env
SECRET_KEY=<generate-with-openssl-rand-hex-32>
DATABASE_URL=postgresql+asyncpg://sme_user:sme_password@postgres:5432/sme_kb
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY=sk-your-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=your-bucket
```

## Volumes

Data is persisted in Docker volumes:
- `postgres_data` - Database data
- `redis_data` - Redis data
- `uploads` - Uploaded documents

### Backup Volumes
```bash
# Backup database
docker-compose exec postgres pg_dump -U sme_user sme_kb > backup.sql

# Restore database
docker-compose exec -T postgres psql -U sme_user sme_kb < backup.sql
```

## Scaling

### Scale Workers
```bash
docker-compose up -d --scale celery_worker=3
```

### Scale API Instances
```bash
docker-compose up -d --scale backend=3
```

## Monitoring

### Check Resource Usage
```bash
docker stats
```

### View Container Info
```bash
docker-compose ps
docker inspect sme_kb_backend
```

## Production Checklist

- [ ] Set strong `SECRET_KEY`
- [ ] Use production database credentials
- [ ] Configure SSL certificates
- [ ] Set up backup strategy
- [ ] Configure monitoring (Sentry)
- [ ] Set resource limits
- [ ] Enable log rotation
- [ ] Configure firewall rules
- [ ] Set up health checks
- [ ] Configure auto-restart policies
