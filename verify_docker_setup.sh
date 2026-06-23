#!/bin/bash
# Docker Compose Setup Verification Script

echo "🔍 PCMR Docker Compose Setup Verification"
echo "=========================================="
echo ""

# Check if Docker is installed
echo "✓ Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "  ✅ Docker found: $DOCKER_VERSION"
else
    echo "  ❌ Docker not found. Please install Docker."
    exit 1
fi

echo ""

# Check if Docker Compose is available
echo "✓ Checking Docker Compose..."
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    echo "  ✅ Docker Compose found: $COMPOSE_VERSION"
else
    echo "  ❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo ""

# Check required files
echo "✓ Checking required files..."
REQUIRED_FILES=(
    "docker-compose.yml"
    "api/Dockerfile"
    "desktop-app/Dockerfile"
    "mobile-app/Dockerfile"
    "desktop-app/nginx.conf"
    "mobile-app/nginx.conf"
    "mqtt5/config/mosquito.conf"
)

ALL_FILES_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - MISSING!"
        ALL_FILES_EXIST=false
    fi
done

echo ""

if [ "$ALL_FILES_EXIST" = true ]; then
    echo "✅ All required files are in place!"
    echo ""
    echo "📦 Next Steps:"
    echo "  1. Run: docker compose up --build"
    echo "  2. Wait for all services to start"
    echo "  3. Open http://localhost:3000 (Desktop) or http://localhost:3001 (Mobile)"
    echo ""
    echo "📚 For more info, see:"
    echo "  - DOCKER_QUICK_REFERENCE.md (quick commands)"
    echo "  - DOCKER_GUIDE.md (detailed guide)"
    echo "  - README_DOCKER_SETUP.md (complete overview)"
    echo ""
    echo "🚀 Ready to go!"
else
    echo "❌ Some required files are missing."
    echo "Please make sure you have extracted/created all Docker configuration files."
    exit 1
fi

