#!/bin/bash

# Check if the Redis container is already running
if [ ! "$(docker ps -q -f name=my-redis)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=my-redis)" ]; then
        # Cleanup
        echo "Removing existing Redis container..."
        docker rm my-redis
    fi
    # Run your container
    echo "Starting Redis container..."
    docker run --name my-redis -p 6379:6379 -d redis redis-server --appendonly yes --requirepass super-secret-password
else
    echo "Redis container already running."
fi
