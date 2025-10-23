#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

# Build the application
echo "📦 Building application..."
pnpm run build

# Run database setup (migrations + test data)
echo "🗄️  Setting up database..."
pnpm run setup

echo "✅ Deployment complete!"

