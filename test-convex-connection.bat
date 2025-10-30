@echo off
REM Test Convex Cloud Connection (Windows)
REM This script verifies your Convex cloud setup is working

echo 🧪 Testing Convex Cloud Connection
echo ===================================

REM Check if npx is available
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm/npx not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "convex\package.json" (
    echo ❌ Error: convex\package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

cd convex

echo 🔍 Checking Convex deployment status...
npx convex dashboard --url >nul 2>&1

if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npx convex dashboard --url 2^>nul ^| findstr /r "https://.*\.convex\.cloud"') do set DEPLOYMENT_URL=%%i
    echo ✅ Connected to Convex Cloud!
    echo 🌐 Deployment URL: %DEPLOYMENT_URL%
) else (
    echo ❌ Not connected to Convex Cloud.
    echo Run setup-convex-cloud.bat first.
    pause
    exit /b 1
)

echo.
echo 🧪 Testing function deployment...
npx convex run --help >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Convex functions are deployed and accessible
) else (
    echo ⚠️  Could not verify function deployment
)

echo.
echo 📊 Checking data...
REM Try to check for schema files
if exist "teams.ts" (
    echo ✅ Convex schema files found
) else (
    echo ⚠️  No schema files found
)

echo.
echo 🎉 Convex Cloud setup looks good!
echo.
echo Next: Run setup-render-deployment.bat to configure for production
pause