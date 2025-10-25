@echo off
echo Starting CTF Platform...
echo.

echo [1/2] Starting Backend Server...
start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python seed_data.py && python main.py"

timeout /t 5 /nobreak > nul

echo [2/2] Starting Frontend Server...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ✅ CTF Platform is starting!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Admin Login:
echo Email: admin@ctf.com
echo Password: admin123
echo.
pause
