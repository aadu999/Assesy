#!/bin/bash

# Stop script for Assesy
# Stops both cloudflared tunnels and docker-compose services

set -e

echo "🛑 Stopping Assesy..."

# Function to stop all tunnels
stop_tunnels() {
    echo "🌐 Stopping cloudflare tunnels..."
    
    for pid_file in tunnel-*.pid; do
        if [ -f "${pid_file}" ]; then
            pid=$(cat "${pid_file}")
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                echo "  ✅ Stopped tunnel (PID: ${pid})"
            fi
            rm "${pid_file}"
        fi
    done
    
    rm -f tunnel-*.url tunnel-*.log
}

# Stop tunnels first
stop_tunnels

# Stop docker-compose
echo "🐳 Stopping Docker Compose..."
docker compose down

echo ""
echo "✅ All services stopped successfully!"
