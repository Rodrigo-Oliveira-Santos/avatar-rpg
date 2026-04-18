#!/bin/bash
# Run development server for frontend or backend
# Usage: ./run-dev.sh [frontend|backend]

cd "$(dirname "$0")/.."

if [ "$1" = "backend" ]; then
    cd backend
    npm run dev
elif [ "$1" = "frontend" ] || [ -z "$1" ]; then
    cd frontend
    npm run dev
else
    echo "Usage: ./run-dev.sh [frontend|backend]"
    exit 1
fi
