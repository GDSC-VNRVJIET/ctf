# Quick Setup Guide

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed
- Git (optional)

## Quick Start (Windows)

1. Double-click `start.bat`
2. Wait for both servers to start
3. Open browser to `http://localhost:3000`
4. Login with admin credentials:
   - Email: `admin@ctf.com`
   - Password: `admin123`

## Quick Start (Linux/Mac)

1. Make the script executable:
```bash
chmod +x start.sh
```

2. Run the script:
```bash
./start.sh
```

3. Open browser to `http://localhost:3000`
4. Login with admin credentials:
   - Email: `admin@ctf.com`
   - Password: `admin123`

## Manual Setup

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python seed_data.py
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## First Steps

### As Admin

1. Login with admin credentials
2. Go to Admin Panel
3. Review pre-created rooms and puzzles
4. Create additional content as needed

### As Player

1. Sign up for a new account
2. Verify email with OTP (check console logs in dev mode)
3. Create or join a team
4. Start solving puzzles in Room 1
5. Use points to buy clues and perks
6. Attack other teams or defend your own

## Testing the Platform

### Test Accounts

Create test accounts to simulate multiple teams:
- team1@test.com / password123
- team2@test.com / password123
- team3@test.com / password123

### Test Flags

Room 1 flags (easy):
- `flag{welcome_to_ctf}`
- `flag{4}`

Room 2 flags (crypto):
- `flag{crypto_is_fun}`
- `flag{base64_decoded}`

### Test Scenarios

1. **Team Formation**: Create multiple teams and join them
2. **Puzzle Solving**: Submit correct and incorrect flags
3. **Point System**: Buy clues and perks
4. **Attack/Defend**: Attack another team, activate shield
5. **Leaderboard**: Watch real-time updates
6. **Admin Controls**: Override team progress, refund points

## Troubleshooting

### Backend won't start
- Check if Python 3.8+ is installed: `python --version`
- Check if port 8000 is available
- Check for errors in console

### Frontend won't start
- Check if Node.js is installed: `node --version`
- Check if port 3000 is available
- Try deleting `node_modules` and running `npm install` again

### Database issues
- Delete `ctf_platform.db` and run `python seed_data.py` again

### OTP not received
- In development, OTP is printed to backend console
- Check backend terminal for OTP codes

## Configuration

### Change Starting Points
Edit `backend/models.py`, line with `points_balance`:
```python
points_balance = Column(Float, default=1000.0)  # Change 1000.0 to desired amount
```

### Change Attack/Defend Costs
Edit `backend/routers/game.py`:
- Attack cost: Line ~180 (`cost = 50.0`)
- Defend cost: Line ~230 (`cost = 30.0`)

### Change Token Expiration
Edit `backend/auth.py`:
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
```

## Production Deployment

⚠️ **Important**: This setup is for development only!

For production:
1. Change `SECRET_KEY` in `backend/auth.py`
2. Use PostgreSQL instead of SQLite
3. Set up proper email service for OTP
4. Enable HTTPS
5. Configure CORS properly
6. Set up reverse proxy (nginx)
7. Use process manager (PM2, systemd)
8. Set up Redis for WebSocket scaling

## Support

For issues or questions:
1. Check the main README.md
2. Review API documentation at `http://localhost:8000/docs`
3. Check browser console for frontend errors
4. Check terminal for backend errors
