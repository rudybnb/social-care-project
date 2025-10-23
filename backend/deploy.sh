#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

# Build the application
echo "📦 Building application..."
npm run build

# Run database setup (migrations + test data)
echo "🗄️  Setting up database..."
npm run setup

echo "✅ Deployment complete!"

