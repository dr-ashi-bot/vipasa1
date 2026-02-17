#!/bin/bash

echo "🔍 Verifying Adaptive Learning Platform Setup..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js $(node --version) installed"
else
    echo "❌ Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm $(npm --version) installed"
else
    echo "❌ npm not found"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) installed"
else
    echo "⚠️  Docker not found (optional, but recommended)"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose $(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1) installed"
else
    echo "⚠️  Docker Compose not found (optional, but recommended)"
fi

echo ""
echo "📁 Checking project structure..."

# Check directories
directories=("backend" "frontend" "shared" "backend/src" "frontend/src")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ exists"
    else
        echo "❌ $dir/ missing"
    fi
done

echo ""
echo "📄 Checking key files..."

# Check key files
files=(
    "docker-compose.yml"
    "README.md"
    "SETUP.md"
    "ARCHITECTURE.md"
    "IMPLEMENTATION_SUMMARY.md"
    "backend/package.json"
    "backend/src/main.ts"
    "backend/src/app.module.ts"
    "frontend/package.json"
    "frontend/App.tsx"
    "shared/package.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🔌 Checking services (if Docker is running)..."

if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        # Check PostgreSQL
        if docker ps | grep -q postgres; then
            echo "✅ PostgreSQL container running"
        else
            echo "⚠️  PostgreSQL container not running (run: docker-compose up -d)"
        fi
        
        # Check MongoDB
        if docker ps | grep -q mongo; then
            echo "✅ MongoDB container running"
        else
            echo "⚠️  MongoDB container not running (run: docker-compose up -d)"
        fi
        
        # Check RabbitMQ
        if docker ps | grep -q rabbitmq; then
            echo "✅ RabbitMQ container running"
        else
            echo "⚠️  RabbitMQ container not running (run: docker-compose up -d)"
        fi
    else
        echo "⚠️  Docker daemon not running"
    fi
fi

echo ""
echo "📦 Checking dependencies..."

# Check backend dependencies
if [ -f "backend/node_modules/.bin/nest" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed (run: cd backend && npm install)"
fi

# Check frontend dependencies
if [ -d "frontend/node_modules/expo" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed (run: cd frontend && npm install)"
fi

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. If Docker containers are not running:"
echo "   docker-compose up -d"
echo ""
echo "2. If backend dependencies not installed:"
echo "   cd backend && npm install"
echo ""
echo "3. If frontend dependencies not installed:"
echo "   cd frontend && npm install"
echo ""
echo "4. Configure environment variables:"
echo "   cp backend/.env.example backend/.env"
echo "   cp frontend/.env.example frontend/.env"
echo "   # Then edit the .env files with your API keys"
echo ""
echo "5. Start the backend:"
echo "   cd backend && npm run start:dev"
echo ""
echo "6. Start the frontend (in a new terminal):"
echo "   cd frontend && npx expo start"
echo ""
echo "📚 For detailed setup instructions, see SETUP.md"
echo "🏗️  For architecture documentation, see ARCHITECTURE.md"
echo "📋 For implementation details, see IMPLEMENTATION_SUMMARY.md"
