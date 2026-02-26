#!/bin/bash

echo "🔍 Verifying AI-Powered SME Knowledge Base Project..."
echo ""

# Check Python files
echo "✓ Checking core files..."
files=(
    "app/main.py"
    "app/core/config.py"
    "app/core/database.py"
    "app/core/security.py"
    "app/core/redis.py"
    "app/core/celery_app.py"
    "app/models/user.py"
    "app/models/company.py"
    "app/models/document.py"
    "app/models/knowledge_entry.py"
    "app/api/v1/router.py"
    "app/api/v1/endpoints/auth.py"
    "app/api/v1/endpoints/documents.py"
    "app/api/v1/endpoints/advisor.py"
    "app/services/ai_service.py"
    "app/services/s3_service.py"
    "app/services/document_processor.py"
    "app/tasks/document_tasks.py"
    "app/tasks/notification_tasks.py"
)

missing=0
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        missing=$((missing + 1))
    fi
done

echo ""
echo "✓ Checking configuration files..."
config_files=(
    ".env.example"
    "requirements.txt"
    "docker-compose.yml"
    "Dockerfile"
    "alembic.ini"
    "Makefile"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        missing=$((missing + 1))
    fi
done

echo ""
echo "✓ Checking documentation..."
docs=(
    "README.md"
    "ARCHITECTURE.md"
    "API_EXAMPLES.md"
    "PROJECT_SUMMARY.md"
    "QUICKSTART.md"
)

for file in "${docs[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        missing=$((missing + 1))
    fi
done

echo ""
if [ $missing -eq 0 ]; then
    echo "✅ All files present! Project structure is complete."
    echo ""
    echo "Next steps:"
    echo "1. Run: ./setup.sh"
    echo "2. Configure .env file"
    echo "3. Run: make docker-up"
    echo "4. Visit: http://localhost:8000/api/v1/docs"
else
    echo "⚠️  $missing file(s) missing. Please check the setup."
fi

echo ""
echo "📊 Project Statistics:"
echo "  Python files: $(find app -name '*.py' | wc -l)"
echo "  Models: $(find app/models -name '*.py' ! -name '__init__.py' | wc -l)"
echo "  Endpoints: $(find app/api -name '*.py' ! -name '__init__.py' ! -name 'router.py' ! -name 'dependencies.py' | wc -l)"
echo "  Services: $(find app/services -name '*.py' ! -name '__init__.py' | wc -l)"
echo "  Tasks: $(find app/tasks -name '*.py' ! -name '__init__.py' | wc -l)"
