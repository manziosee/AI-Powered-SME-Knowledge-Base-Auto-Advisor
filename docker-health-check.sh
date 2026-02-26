#!/bin/bash
set -e

echo "🔍 Checking Docker services health..."

# Check if docker-compose is running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Docker services are not running"
    echo "Run: docker-compose up -d"
    exit 1
fi

# Check PostgreSQL
echo "Checking PostgreSQL..."
if docker-compose exec -T postgres pg_isready -U sme_user > /dev/null 2>&1; then
    echo "✓ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL is not responding"
    exit 1
fi

# Check Redis
echo "Checking Redis..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✓ Redis is healthy"
else
    echo "❌ Redis is not responding"
    exit 1
fi

# Check Backend API
echo "Checking Backend API..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Backend API is healthy"
else
    echo "❌ Backend API is not responding"
    exit 1
fi

# Check Celery Worker
echo "Checking Celery Worker..."
if docker-compose logs celery_worker 2>&1 | grep -q "ready"; then
    echo "✓ Celery Worker is running"
else
    echo "⚠️  Celery Worker may not be ready yet"
fi

# Check Flower
echo "Checking Flower..."
if curl -s http://localhost:5555 > /dev/null 2>&1; then
    echo "✓ Flower is accessible"
else
    echo "⚠️  Flower is not accessible"
fi

echo ""
echo "✅ All critical services are healthy!"
echo ""
echo "📊 Service URLs:"
echo "  • API: http://localhost:8000"
echo "  • Docs: http://localhost:8000/api/v1/docs"
echo "  • Flower: http://localhost:5555"
