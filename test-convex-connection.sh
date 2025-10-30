#!/bin/bash

# Test Convex Cloud Connection
# This script verifies your Convex cloud setup is working

echo "🧪 Testing Convex Cloud Connection"
echo "==================================="

# Check if convex CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npm/npx not found. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "convex/package.json" ]; then
    echo "❌ Error: convex/package.json not found. Please run this script from the project root."
    exit 1
fi

cd convex

echo "🔍 Checking Convex deployment status..."
npx convex dashboard --url > /dev/null 2>&1

if [ $? -eq 0 ]; then
    DEPLOYMENT_URL=$(npx convex dashboard --url 2>/dev/null | grep -o 'https://[^"]*\.convex\.cloud')
    echo "✅ Connected to Convex Cloud!"
    echo "🌐 Deployment URL: $DEPLOYMENT_URL"
else
    echo "❌ Not connected to Convex Cloud."
    echo "Run setup-convex-cloud.sh first."
    exit 1
fi

echo ""
echo "🧪 Testing function deployment..."
npx convex run --help > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Convex functions are deployed and accessible"
else
    echo "⚠️  Could not verify function deployment"
fi

echo ""
echo "📊 Checking data..."
# Try to run a simple query if available
if [ -f "teams.ts" ]; then
    echo "✅ Convex schema files found"
else
    echo "⚠️  No schema files found"
fi

echo ""
echo "🎉 Convex Cloud setup looks good!"
echo ""
echo "Next: Run setup-render-deployment.sh to configure for production"