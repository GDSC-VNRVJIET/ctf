#!/bin/bash

# CTF Platform Deployment Setup Script
# This script helps configure environment variables for Render deployment

echo "🚀 CTF Platform - Render Deployment Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "📝 Please provide the following information:"
echo ""

# Get Convex URL
read -p "Enter your Convex deployment URL (e.g., https://your-project.convex.cloud): " CONVEX_URL
if [ -z "$CONVEX_URL" ]; then
    echo "❌ Convex URL is required"
    exit 1
fi

# Get MongoDB URL (optional)
read -p "Enter your MongoDB connection string (optional, press Enter to skip): " MONGO_URL

echo ""
echo "🔧 Updating configuration files..."

# Update render.yaml
sed -i.bak "s|value: \"https://your-convex-deployment-url\"|value: \"$CONVEX_URL\"|g" render.yaml
if [ -n "$MONGO_URL" ]; then
    sed -i.bak "s|value: \"your-mongodb-connection-string\"|value: \"$MONGO_URL\"|g" render.yaml
fi

# Update frontend .env.production
sed -i.bak "s|VITE_CONVEX_URL=.*|VITE_CONVEX_URL=$CONVEX_URL|g" frontend/.env.production

# Update backend .env.production
sed -i.bak "s|CONVEX_URL=.*|CONVEX_URL=$CONVEX_URL|g" backend/.env.production
if [ -n "$MONGO_URL" ]; then
    sed -i.bak "s|MONGO_URL=.*|MONGO_URL=$MONGO_URL|g" backend/.env.production
fi

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push these changes to your GitHub repository"
echo "2. Go to https://dashboard.render.com"
echo "3. Click 'New' → 'Blueprint'"
echo "4. Connect your GitHub repository"
echo "5. Render will detect the render.yaml file automatically"
echo "6. After deployment, update the CORS settings in backend/main.py with your frontend URL"
echo ""
echo "📚 For detailed instructions, see RENDER_DEPLOYMENT.md"