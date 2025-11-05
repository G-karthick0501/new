#!/bin/bash
# Startup script for LOCAL system - Only Backend + Frontend
# LIGHTWEIGHT - No AI services (resource-conscious)

PROJECT_DIR="/home/sunkar/projects/new"
LOG_DIR="/tmp/ai-platform-local-logs"

mkdir -p "$LOG_DIR"

echo "🚀 Starting AI Recruitment Platform (LOCAL - Lightweight)"
echo "📁 Project: $PROJECT_DIR"  
echo "📝 Logs: $LOG_DIR"
echo "⚠️  AI Services NOT started (use Codespaces for full testing)"
echo ""

# Stop existing services
echo "🛑 Stopping existing services..."
pkill -f "node server.js" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Monitor CPU before starting
echo "📊 CPU Usage Before:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "   CPU: " 100 - $1 "%"}'
echo ""

# 1. Backend API (Port 5000)
echo "▶️  Starting Backend API (Port 5000)..."
cd "$PROJECT_DIR/backend"
nohup node server.js > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID | Log: $LOG_DIR/backend.log"

# 2. Frontend (Port 5173)
echo "▶️  Starting Frontend (Port 5173)..."
cd "$PROJECT_DIR/frontend"
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID | Log: $LOG_DIR/frontend.log"

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "📊 Service Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_service() {
    local name=$1
    local port=$2
    local log=$3
    
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ $name (Port $port) - RUNNING"
    else
        echo "❌ $name (Port $port) - DOWN (check $log)"
    fi
}

check_service "Backend API" 5000 "$LOG_DIR/backend.log"
check_service "Frontend   " 5173 "$LOG_DIR/frontend.log"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Monitor CPU after starting
echo "📊 CPU Usage After:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "   CPU: " 100 - $1 "%"}'
echo ""

echo "📝 View logs:"
echo "   Backend : tail -f $LOG_DIR/backend.log"
echo "   Frontend: tail -f $LOG_DIR/frontend.log"
echo ""
echo "🛑 Stop services: pkill -f 'node server.js|npm run dev'"
echo ""
echo "✅ Local services started! Open http://localhost:5173"
