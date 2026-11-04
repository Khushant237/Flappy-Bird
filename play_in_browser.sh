#!/usr/bin/env bash
PORT=${1:-8080}
echo "Starting Flappy Bird 3D web preview at http://localhost:$PORT"
echo "Press Ctrl+C to stop."
cd "/home/khushant/Flappy Bird/game"
python3 -m http.server "$PORT"
