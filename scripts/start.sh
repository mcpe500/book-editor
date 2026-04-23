#!/bin/bash

echo "========================================"
echo "Book Editor - Starting Services"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "[1/2] Installing backend dependencies..."
    cd "$PROJECT_DIR/backend"
    npm install
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "[2/2] Installing frontend dependencies..."
    cd "$PROJECT_DIR/frontend"
    npm install
fi

echo "Starting services..."
echo ""

# Start backend
echo "Starting Backend on port 3001..."
cd "$PROJECT_DIR/backend"
npm run dev &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "Starting Frontend on port 5173..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Services started:"
echo "  - Backend: http://localhost:3001"
echo "  - Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait