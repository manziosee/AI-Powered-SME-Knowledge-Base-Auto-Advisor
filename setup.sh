#!/bin/bash

echo "🚀 Setting up SME Knowledge Base Auto Advisor..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Download spaCy model
echo "🤖 Downloading spaCy model..."
python -m spacy download en_core_web_sm

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your credentials"
fi

# Create uploads directory
mkdir -p uploads

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Setup PostgreSQL with pgvector extension"
echo "3. Run: alembic upgrade head"
echo "4. Start services:"
echo "   - API: make run-dev"
echo "   - Worker: make run-worker"
echo "   - Beat: make run-beat"
echo ""
echo "Or use Docker: make docker-up"
