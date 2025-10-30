@echo off
REM Convex Cloud Setup Script (Windows)
REM This script helps set up Convex cloud deployment for team collaboration

echo 🚀 CTF Platform - Convex Cloud Setup
echo ====================================

REM Check if we're in the right directory
if not exist "convex\package.json" (
    echo ❌ Error: convex\package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo.
echo 📋 Prerequisites Check:
echo 1. Sign up at https://convex.dev
echo 2. Install Convex CLI: npm install -g convex
echo 3. Create a new project at https://dashboard.convex.dev
echo.

set /p PREREQ="Have you completed the prerequisites above? (y/N): "
if /i not "%PREREQ%"=="y" (
    echo Please complete the prerequisites first, then run this script again.
    pause
    exit /b 1
)

echo.
echo 🔧 Setting up Convex Cloud...

REM Navigate to convex directory
cd convex

REM Login to Convex
echo Logging in to Convex...
npx convex login

if %errorlevel% neq 0 (
    echo ❌ Convex login failed. Please try again.
    pause
    exit /b 1
)

REM Link to cloud deployment
echo Linking to cloud deployment...
npx convex dev --once

if %errorlevel% neq 0 (
    echo ❌ Failed to link to cloud deployment. Make sure you've created a project.
    pause
    exit /b 1
)

REM Deploy functions
echo Deploying Convex functions to cloud...
npx convex deploy

if %errorlevel% neq 0 (
    echo ❌ Deployment failed. Check your functions for errors.
    pause
    exit /b 1
)

REM Get deployment URL
echo Getting deployment URL...
for /f "tokens=*" %%i in ('npx convex dashboard --url 2^>nul ^| findstr /r "https://.*\.convex\.cloud"') do set DEPLOYMENT_URL=%%i

if "%DEPLOYMENT_URL%"=="" (
    echo ⚠️  Could not automatically detect deployment URL.
    set /p DEPLOYMENT_URL="Please enter your Convex deployment URL (from dashboard): "
)

echo.
echo ✅ Convex Cloud Setup Complete!
echo.
echo 🌐 Your Convex Deployment URL: %DEPLOYMENT_URL%
echo.
echo 📝 Next steps:
echo 1. Share this deployment URL with your team members
echo 2. Run the Render deployment setup script:
echo    setup-render-deployment.bat
echo 3. When prompted, enter this URL: %DEPLOYMENT_URL%
echo.
echo 👥 Team Collaboration:
echo - Invite team members at: https://dashboard.convex.dev
echo - Each member should run: npx convex login ^&^& npx convex dev --once
echo - Deploy changes with: npx convex deploy
echo.
echo 📚 For detailed instructions, see CONVEX_CLOUD_SETUP.md
pause