#!/bin/bash

# Voice Chat Application Deployment Script

set -e

echo "🚀 Starting deployment process..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Check if build was successful
if [ ! -d "backend/public" ] || [ -z "$(ls -A backend/public)" ]; then
    echo "❌ Frontend build failed or public directory is empty"
    exit 1
fi

echo "✅ Frontend build completed"

# Deploy to Cloudflare Workers
echo "☁️  Deploying to Cloudflare Workers..."
cd backend

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

# Deploy
wrangler deploy

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is now live on Cloudflare Workers"
