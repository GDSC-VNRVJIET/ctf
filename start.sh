#!/bin/bash

echo "Starting CTF Platform..."
echo ""

echo "[1/2] Starting Backend Server..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed_data.py
python main.py &
BACKEND_PID=$!
cd ..

sleep 5

echo "[2/2] Starting Frontend Server..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ CTF Platform is running!"
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Admin Login:"
echo "Email: admin@ctf.com"
echo "Password: admin123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
