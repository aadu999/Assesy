#!/bin/bash
set -e

# Fix permissions for the project directory
# This ensures the coder user can read/write files mounted from the host
if [ -d "/home/coder/project" ]; then
    echo "Fixing permissions for /home/coder/project..."
    chown -R coder:coder /home/coder/project || echo "Warning: Could not change ownership"
    chmod -R u+rw /home/coder/project || echo "Warning: Could not change permissions"
fi

# Switch to the coder user and execute the command
echo "Starting code-server as user 'coder'..."
exec gosu coder "$@"