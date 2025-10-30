#!/bin/bash

# Convex Cloud Setup Script
# This script helps set up Convex cloud deployment for team collaboration

echo "🚀 CTF Platform - Convex Cloud Setup"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "convex/package.json" ]; then
    echo "❌ Error: convex/package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Prerequisites Check:"
echo "1. Sign up at https://convex.dev"
echo "2. Install Convex CLI: npm install -g convex"
echo "3. Create a new project at https://dashboard.convex.dev"
echo ""

read -p "Have you completed the prerequisites above? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the prerequisites first, then run this script again."
    exit 1
fi

echo ""
echo "🔧 Setting up Convex Cloud..."

# Navigate to convex directory
cd convex

# Login to Convex
echo "Logging in to Convex..."
npx convex login

if [ $? -ne 0 ]; then
    echo "❌ Convex login failed. Please try again."
    exit 1
fi

# Link to cloud deployment
echo "Linking to cloud deployment..."
npx convex dev --once

if [ $? -ne 0 ]; then
    echo "❌ Failed to link to cloud deployment. Make sure you've created a project."
    exit 1
fi

# Deploy functions
echo "Deploying Convex functions to cloud..."
npx convex deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed. Check your functions for errors."
    exit 1
fi

# Get deployment URL
echo "Getting deployment URL..."
DEPLOYMENT_URL=$(npx convex dashboard --url 2>/dev/null | grep -o 'https://[^"]*\.convex\.cloud')

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "⚠️  Could not automatically detect deployment URL."
    read -p "Please enter your Convex deployment URL (from dashboard): " DEPLOYMENT_URL
fi

echo ""
echo "✅ Convex Cloud Setup Complete!"
echo ""
echo "🌐 Your Convex Deployment URL: $DEPLOYMENT_URL"
echo ""
echo "📝 Next steps:"
echo "1. Share this deployment URL with your team members"
echo "2. Run the Render deployment setup script:"
echo "   ./setup-render-deployment.sh"
echo "3. When prompted, enter this URL: $DEPLOYMENT_URL"
echo ""
echo "👥 Team Collaboration:"
echo "- Invite team members at: https://dashboard.convex.dev"
echo "- Each member should run: npx convex login && npx convex dev --once"
echo "- Deploy changes with: npx convex deploy"
echo ""
echo "📚 For detailed instructions, see CONVEX_CLOUD_SETUP.md"