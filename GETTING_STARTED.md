# Getting Started with CTF Platform

Welcome! This guide will help you get the CTF platform up and running quickly.

## 🚀 Quick Start (5 minutes)

### Windows Users
1. Open Command Prompt or PowerShell
2. Navigate to the project folder
3. Run: `start.bat`
4. Wait for both servers to start
5. Open browser: `http://localhost:3000`

### Linux/Mac Users
1. Open Terminal
2. Navigate to the project folder
3. Run: `chmod +x start.sh && ./start.sh`
4. Wait for both servers to start
5. Open browser: `http://localhost:3000`

## 📋 What You'll See

### First Time Setup
The startup script will:
1. ✅ Create Python virtual environment
2. ✅ Install backend dependencies
3. ✅ Create SQLite database
4. ✅ Seed initial data (rooms, puzzles, admin user)
5. ✅ Start backend server on port 8000
6. ✅ Install frontend dependencies
7. ✅ Start frontend server on port 3000

### Default Admin Account
```
Email: admin@ctf.com
Password: admin123
```

## 🎮 Your First Game

### Step 1: Create Player Accounts
1. Click "Sign up" on login page
2. Enter name, email, password
3. Note the OTP from backend console
4. Verify email with OTP
5. Repeat for 2-3 test accounts

### Step 2: Form Teams
1. Login with first account
2. Click "Create or Join a Team"
3. Create team with name (e.g., "Team Alpha")
4. Copy the invite code
5. Login with second account
6. Join team using invite code

### Step 3: Start Playing
1. Go to Dashboard
2. Click "Enter Room" on Room 1
3. Read puzzle description
4. Submit flag: `flag{welcome_to_ctf}`
5. Earn 50 points!

### Step 4: Try Advanced Features
1. **Buy a Clue**: Click "Buy Clue" on any puzzle
2. **Visit Shop**: Purchase perks with points
3. **Attack Team**: Go to Leaderboard, click "Attack" on another team
4. **Activate Shield**: Click "Activate Shield" to protect your team
5. **Check Leaderboard**: Watch real-time updates

## 🎯 Sample Flags for Testing

### Room 1 (Welcome)
- `flag{welcome_to_ctf}` - Basic Flag puzzle
- `flag{4}` - Simple Math puzzle

### Room 2 (Cryptography)
- `flag{crypto_is_fun}` - Caesar Cipher (ROT13)
- `flag{base64_decoded}` - Base64 puzzle

### Room 3 (Web Exploitation)
- `flag{sql_injection_master}` - SQL Injection
- `flag{xss_detected}` - XSS Challenge

### Room 4 (Reverse Engineering)
- `flag{reverse_engineering_pro}` - Binary Analysis
- `flag{assembly_decoded}` - Assembly Code

### Room 5 (Final Challenge)
- `flag{ctf_champion_2024}` - Final Boss

## 👨‍💼 Admin Features

### Access Admin Panel
1. Login with admin account
2. Click "Admin" in navigation
3. Explore tabs: Rooms, Teams, Logs, Create Content

### Create New Room
1. Go to Admin Panel → Create Content
2. Select "Room" from dropdown
3. Fill in details:
   - Name: "Room 6: Bonus"
   - Order Index: 6
   - Description: "Extra challenges"
   - Unlock Cost: 100
4. Click "Create Room"

### Create New Puzzle
1. Go to Admin Panel → Create Content
2. Select "Puzzle" from dropdown
3. Fill in details:
   - Room: Select room
   - Title: "New Challenge"
   - Description: "Solve this..."
   - Flag: `flag{your_flag_here}`
   - Points: 150
4. Click "Create Puzzle"

### Monitor Teams
1. Go to Admin Panel → Teams
2. View all teams, points, progress
3. Refund points if needed
4. Disable suspicious teams

### View Audit Logs
1. Go to Admin Panel → Logs
2. See all actions: logins, purchases, attacks, submissions
3. Filter and search logs

## 🔧 Common Tasks

### Reset Database
```bash
# Stop servers (Ctrl+C)
# Delete database
rm backend/ctf_platform.db  # Linux/Mac
del backend\ctf_platform.db  # Windows

# Reseed database
cd backend
python seed_data.py
```

### Change Starting Points
Edit `backend/models.py`, line 35:
```python
points_balance = Column(Float, default=2000.0)  # Changed from 1000
```

### Change Attack Cost
Edit `backend/routers/game.py`, line ~180:
```python
cost = 100.0  # Changed from 50.0
```

### Add More Perks
Edit `backend/seed_data.py`, add to `perks_data` list:
```python
{
    "name": "Super Shield",
    "description": "Ultimate protection for 30 minutes",
    "cost": 150,
    "perk_type": "defense",
    "effect_json": '{"type": "shield", "duration": 1800}',
    "is_one_time": False
}
```

## 🐛 Troubleshooting

### "Port already in use"
**Backend (8000):**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Frontend (3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### "Module not found"
**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules  # or rmdir /s node_modules on Windows
npm install
```

### "Database locked"
```bash
# Stop all servers
# Delete database
rm backend/ctf_platform.db
# Restart and reseed
```

### "OTP not working"
- Check backend console for OTP code
- OTP expires in 10 minutes
- Use "Resend OTP" if expired

### "Can't submit flags"
- Check if team is under attack (red badge on leaderboard)
- Wait for attack to expire (5 minutes)
- Or activate shield before attack

## 📊 Understanding the Game

### Points System
- **Start**: 1000 points per team
- **Earn**: Solve puzzles (50-500 points)
- **Spend**: Clues (5-200 pts), Perks (30-100 pts), Actions (30-50 pts)

### Room Progression
1. Room 1: Free entry
2. Room 2: 100 points to unlock
3. Room 3: 200 points to unlock
4. Room 4: 300 points to unlock
5. Room 5: 500 points to unlock

### Attack/Defend Mechanics
- **Attack**: 50 points, blocks target for 5 minutes
- **Defend**: 30 points, shield for 10 minutes
- **Immunity**: 3 minutes after being attacked
- **Strategy**: Attack leaders, defend when ahead

### Scoring Formula
```
Score = Points Balance + (Solved Puzzles × 100) + (Current Room × 500)
```

### Winning Strategy
1. Solve easy puzzles first (Room 1-2)
2. Buy clues strategically (only when stuck)
3. Save points for room unlocks
4. Attack teams ahead of you
5. Defend when you're leading
6. Invest in challenges for 2x returns

## 🎓 Learning Resources

### API Documentation
- Backend API: `http://localhost:8000/docs`
- Interactive Swagger UI with all endpoints
- Test API calls directly from browser

### Code Structure
- See `PROJECT_STRUCTURE.md` for detailed architecture
- Backend: `backend/` folder
- Frontend: `frontend/src/` folder
- Models: `backend/models.py`
- Routes: `backend/routers/`

### Customization Guide
- See `README.md` for full documentation
- Configuration options
- Production deployment
- Security best practices

## 🤝 Multi-Player Testing

### Simulate Competition
1. Create 3-4 teams with different accounts
2. Open multiple browser windows (use incognito for different sessions)
3. Have each team solve puzzles at different speeds
4. Test attacks between teams
5. Watch leaderboard update in real-time

### Test Scenarios
- ✅ Team creates and joins
- ✅ Flag submission (correct/incorrect)
- ✅ Clue purchasing
- ✅ Perk purchasing
- ✅ Attack another team
- ✅ Shield activation
- ✅ Room unlocking
- ✅ Leaderboard updates
- ✅ Admin overrides

## 📞 Need Help?

1. Check `README.md` for detailed documentation
2. Check `SETUP.md` for installation issues
3. Check `PROJECT_STRUCTURE.md` for code architecture
4. Review API docs at `http://localhost:8000/docs`
5. Check browser console for frontend errors
6. Check terminal for backend errors

## 🎉 You're Ready!

You now have a fully functional CTF platform. Start creating challenges, invite players, and run your competition!

**Happy Hacking! 🚩**
