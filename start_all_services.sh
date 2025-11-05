#!/bin/bash
# Startup script for AI Recruitment Platform - All services
# Logs to /tmp - doesn't block terminals

WORKSPACE="/workspaces/ai-recruitment-platform-codespaces-test"
LOG_DIR="/tmp/ai-platform-logs"

# Create log directory
mkdir -p "$LOG_DIR"

echo "🚀 Starting AI Recruitment Platform Services..."
echo "📁 Workspace: $WORKSPACE"
echo "📝 Logs: $LOG_DIR"
echo ""

# Stop existing services
echo "🛑 Stopping existing services..."
pkill -f "node server.js" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null  
pkill -f "resume-analyzer/venv" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null
sleep 2

# 1. Backend API (Port 5000)
echo "▶️  Starting Backend API (Port 5000)..."
cd "$WORKSPACE/backend"
nohup node server.js > "$LOG_DIR/backend.log" 2>&1 &
echo "   PID: $! | Log: $LOG_DIR/backend.log"

# 2. Frontend (Port 5173)
echo "▶️  Starting Frontend (Port 5173)..."
cd "$WORKSPACE/frontend"
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
echo "   PID: $! | Log: $LOG_DIR/frontend.log"

# 3. Resume Analyzer (Port 8000)
echo "▶️  Starting Resume Analyzer (Port 8000)..."
cd "$WORKSPACE/ai_services4/resume-analyzer"
source venv/bin/activate
nohup python app.py > "$LOG_DIR/resume-analyzer.log" 2>&1 &
echo "   PID: $! | Log: $LOG_DIR/resume-analyzer.log"
deactivate

# 4. Video Emotion (Port 8001)  
echo "▶️  Starting Video Emotion Analyzer (Port 8001)..."
cd "$WORKSPACE/ai_services4/interview-analyzer"
nohup node human_emotion_service.js > "$LOG_DIR/video-emotion.log" 2>&1 &
echo "   PID: $! | Log: $LOG_DIR/video-emotion.log"

# 5. Audio Emotion (Port 8002)
echo "▶️  Starting Audio Emotion Analyzer (Port 8002)..."
cd "$WORKSPACE/ai_services4/audio-emotion"
if [ -d "venv_audio_emotion" ]; then
    source venv_audio_emotion/bin/activate
    nohup python app_cpu_friendly.py > "$LOG_DIR/audio-emotion.log" 2>&1 &
    echo "   PID: $! | Log: $LOG_DIR/audio-emotion.log"
    deactivate
else
    echo "   ⚠️  venv not found - skipping"
fi

# 6. Transcription (Port 8003)
echo "▶️  Starting Transcription Service (Port 8003)..."
cd "$WORKSPACE/ai_services4/interview-analyzer"
if [ -d "whisper_venv" ]; then
    source whisper_venv/bin/activate
    nohup python whisper_service.py > "$LOG_DIR/transcription.log" 2>&1 &
    echo "   PID: $! | Log: $LOG_DIR/transcription.log"
    deactivate
else
    echo "   ⚠️  venv not found - skipping"
fi

echo ""
echo "⏳ Waiting for services to start..."
sleep 8

echo ""
echo "📊 Service Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check each service
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

check_service "Backend API        " 5000 "$LOG_DIR/backend.log"
check_service "Frontend           " 5173 "$LOG_DIR/frontend.log"
check_service "Resume Analyzer    " 8000 "$LOG_DIR/resume-analyzer.log"
check_service "Video Emotion      " 8001 "$LOG_DIR/video-emotion.log"
check_service "Audio Emotion      " 8002 "$LOG_DIR/audio-emotion.log"
check_service "Transcription      " 8003 "$LOG_DIR/transcription.log"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 View logs: tail -f $LOG_DIR/<service>.log"
echo "🛑 Stop all: pkill -f 'node server.js|npm run dev|uvicorn|python app'"
echo ""
echo "✅ All services started!"
