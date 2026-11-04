#!/usr/bin/env bash
PORT=${1:-8080}
echo "Starting Flappy Bird 3D web preview at http://localhost:$PORT"
echo "Press Ctrl+C to stop."
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/game"
python3 -m http.server "$PORT"
