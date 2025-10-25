# Quick Reference Guide

## 🚀 Start the Platform

### Windows
```bash
start.bat
```

### Linux/Mac
```bash
chmod +x start.sh && ./start.sh
```

## 🔑 Default Credentials

```
Admin Account:
Email: admin@ctf.com
Password: admin123
```

## 🌐 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🚩 Test Flags

```
Room 1:
- flag{welcome_to_ctf}
- flag{4}

Room 2:
- flag{crypto_is_fun}
- flag{base64_decoded}

Room 3:
- flag{sql_injection_master}
- flag{xss_detected}

Room 4:
- flag{reverse_engineering_pro}
- flag{assembly_decoded}

Room 5:
- flag{ctf_champion_2024}
```

## 💰 Default Costs

- Starting Points: 1000
- Attack: 50 points (5 min block)
- Defend: 30 points (10 min shield)
- Room 2 Unlock: 100 points
- Room 3 Unlock: 200 points
- Room 4 Unlock: 300 points
- Room 5 Unlock: 500 points

## 📋 Common Commands

### Reset Database
```bash
# Stop servers (Ctrl+C)
cd backend
rm ctf_platform.db  # or del on Windows
python seed_data.py
```

### Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Run Individually
```bash
# Backend only
cd backend
python main.py

# Frontend only
cd frontend
npm run dev
```

## 🎮 Quick Test Flow

1. **Sign up** → Enter OTP from console
2. **Create team** → Note invite code
3. **Enter Room 1** → Submit `flag{welcome_to_ctf}`
4. **Buy clue** → Spend 5 points
5. **Go to Shop** → Purchase a perk
6. **Check Leaderboard** → See your rank
7. **Attack team** → Click attack button
8. **Activate Shield** → Protect your team

## 🛠️ File Locations

### Configuration
- Backend secret: `backend/auth.py` (SECRET_KEY)
- Starting points: `backend/models.py` (Team.points_balance)
- CORS origins: `backend/main.py` (allow_origins)

### Data
- Database: `backend/ctf_platform.db`
- Seed data: `backend/seed_data.py`

### Frontend
- API proxy: `frontend/vite.config.js`
- Auth context: `frontend/src/context/AuthContext.jsx`
- Styles: `frontend/src/index.css`

## 🔧 Quick Fixes

### Port in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :8000   # Windows (then taskkill)

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3000   # Windows (then taskkill)
```

### Module Not Found
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules && npm install
```

### Database Locked
```bash
# Stop all servers
# Delete database
rm backend/ctf_platform.db
# Restart
```

## 📊 API Endpoints

### Auth
- POST `/api/auth/signup`
- POST `/api/auth/login`
- POST `/api/auth/verify-email`
- GET `/api/auth/me`

### Teams
- POST `/api/teams`
- POST `/api/teams/{id}/join`
- GET `/api/teams/my/team`

### Game
- GET `/api/rooms`
- POST `/api/puzzles/{id}/submit`
- POST `/api/clues/{id}/buy`
- POST `/api/perks/{id}/buy`
- POST `/api/actions`
- GET `/api/leaderboard`

### Admin
- POST `/api/admin/rooms`
- POST `/api/admin/puzzles`
- POST `/api/admin/clues`
- GET `/api/admin/teams`
- GET `/api/admin/logs`

## 🎯 Key Features

✅ Email verification with OTP
✅ Team creation & joining
✅ 5 sequential rooms
✅ Flag submission & validation
✅ Clue purchasing system
✅ Perk shop
✅ Attack/Defend mechanics
✅ Real-time leaderboard
✅ Admin panel
✅ Audit logging
✅ WebSocket updates

## 📚 Documentation

- **README.md** - Full documentation
- **SETUP.md** - Installation guide
- **GETTING_STARTED.md** - Tutorial
- **PROJECT_STRUCTURE.md** - Code architecture
- **IMPLEMENTATION_SUMMARY.md** - Feature list

## 🆘 Help

1. Check documentation files
2. Visit http://localhost:8000/docs for API docs
3. Check browser console for errors
4. Check terminal for backend logs
5. Review error messages carefully

## 🎉 You're Ready!

Everything is set up and ready to go. Just run the start script and begin playing!
