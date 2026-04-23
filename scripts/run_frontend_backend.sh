#!/bin/bash

echo "========================================"
echo "Book Editor - Starting Frontend & Backend"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "[1/2] Starting Backend on port 3001..."
cd "$PROJECT_DIR/backend"
npm run dev &
BACKEND_PID=$!

sleep 3

echo "[2/2] Starting Frontend on port 5173..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Services starting:"
echo "  - Backend: http://localhost:3001"
echo "  - Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait