@echo off
REM CTF Platform Deployment Setup Script (Windows)
REM This script helps configure environment variables for Render deployment

echo 🚀 CTF Platform - Render Deployment Setup
echo ==========================================

REM Check if we're in the right directory
if not exist "render.yaml" (
    echo ❌ Error: render.yaml not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo 📝 Please provide the following information:
echo.

REM Get Convex URL
set /p CONVEX_URL="Enter your Convex deployment URL (e.g., https://your-project.convex.cloud): "
if "%CONVEX_URL%"=="" (
    echo ❌ Convex URL is required
    pause
    exit /b 1
)

REM Get MongoDB URL (optional)
set /p MONGO_URL="Enter your MongoDB connection string (optional, press Enter to skip): "

echo.
echo 🔧 Updating configuration files...

REM Update render.yaml
powershell -Command "(Get-Content render.yaml) -replace 'value: \"https://your-convex-deployment-url\"', 'value: \"%CONVEX_URL%\"' | Set-Content render.yaml"
if defined MONGO_URL (
    powershell -Command "(Get-Content render.yaml) -replace 'value: \"your-mongodb-connection-string\"', 'value: \"%MONGO_URL%\"' | Set-Content render.yaml"
)

REM Update frontend .env.production
powershell -Command "(Get-Content frontend\.env.production) -replace 'VITE_CONVEX_URL=.*', 'VITE_CONVEX_URL=%CONVEX_URL%' | Set-Content frontend\.env.production"

REM Update backend .env.production
powershell -Command "(Get-Content backend\.env.production) -replace 'CONVEX_URL=.*', 'CONVEX_URL=%CONVEX_URL%' | Set-Content backend\.env.production"
if defined MONGO_URL (
    powershell -Command "(Get-Content backend\.env.production) -replace 'MONGO_URL=.*', 'MONGO_URL=%MONGO_URL%' | Set-Content backend\.env.production"
)

echo.
echo ✅ Configuration updated successfully!
echo.
echo 📋 Next steps:
echo 1. Commit and push these changes to your GitHub repository
echo 2. Go to https://dashboard.render.com
echo 3. Click 'New' → 'Blueprint'
echo 4. Connect your GitHub repository
echo 5. Render will detect the render.yaml file automatically
echo 6. After deployment, update the CORS settings in backend/main.py with your frontend URL
echo.
echo 📚 For detailed instructions, see RENDER_DEPLOYMENT.md
pause