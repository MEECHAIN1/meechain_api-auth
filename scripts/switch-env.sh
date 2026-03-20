#!/bin/bash
# switch-env.sh - Bash script to switch between Hardhat and Ritual environments
# Usage: ./switch-env.sh ritual   OR   ./switch-env.sh hardhat

ENV_NAME=$1
ENV_FILE=".env"
EXAMPLE_FILE="deploy/.env.example"

# Validate input
if [[ "$ENV_NAME" != "ritual" && "$ENV_NAME" != "hardhat" ]]; then
    echo "Usage: ./switch-env.sh [ritual|hardhat]"
    exit 1
fi

# Check if .env exists, if not create from example
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating $ENV_FILE from $EXAMPLE_FILE..."
    cp $EXAMPLE_FILE $ENV_FILE
fi

# Update USE_ENV value using sed
# Check if USE_ENV exists in .env
if grep -q "^USE_ENV=" "$ENV_FILE"; then
    # Replace existing USE_ENV
    sed -i "s/^USE_ENV=.*/USE_ENV=$ENV_NAME/" "$ENV_FILE"
else
    # Append USE_ENV if not found
    echo "USE_ENV=$ENV_NAME" >> "$ENV_FILE"
fi

echo "Environment switched to: $ENV_NAME"
echo "Please restart Docker Compose for changes to take effect: docker compose restart caddy"
