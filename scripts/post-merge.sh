#!/bin/bash
set -e

echo "Running post-merge setup..."

# Install dependencies (skip scripts to avoid blocked packages)
npm install --ignore-scripts

# Push database schema
npm run db:push

echo "Post-merge setup complete."
