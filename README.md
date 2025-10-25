# CTF Platform - Room Style Capture The Flag

A full-featured web-based CTF platform with team-based gameplay, real-time monitoring, attack/defend mechanics, and purchasable perks.

## Features

- **Authentication**: Email/password with OTP verification
- **Team Management**: Create teams, invite members, team captain roles
- **5 Sequential Rooms**: Progress through rooms by solving puzzles
- **Points System**: Earn and spend points on clues, perks, and actions
- **Attack/Defend/Invest**: Red-team/blue-team style mechanics
- **Real-time Leaderboard**: Live updates via WebSocket
- **Shop System**: Purchase perks, tools, and clues
- **Admin Panel**: Manage rooms, puzzles, teams, and view audit logs
- **Security**: JWT authentication, rate limiting, flag hashing

## Tech Stack

**Backend:**
- FastAPI (Python)
- SQLite with SQLAlchemy ORM
- JWT authentication
- WebSocket support

**Frontend:**
- React 18
- React Router
- Axios for API calls
- Vite for build tooling

## Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the server:
```bash
python main.py
```

Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Usage

### For Players

1. **Sign Up**: Create an account with email and password
2. **Verify Email**: Enter the OTP sent to your email (check console in dev mode)
3. **Create/Join Team**: Form a team or join using invite code
4. **Start Playing**: Navigate through rooms, solve puzzles, submit flags
5. **Use Shop**: Purchase clues, perks, and tools with points
6. **Strategic Actions**:
   - **Attack**: Sabotage other teams (50 points)
   - **Defend**: Activate shield protection (30 points)
   - **Invest**: Invest in challenges for 2x returns

### For Admins

1. **Access Admin Panel**: Available for users with admin/organiser role
2. **Create Rooms**: Set up sequential rooms with unlock costs
3. **Add Puzzles**: Create challenges with flags and point rewards
4. **Add Clues**: Provide hints that teams can purchase
5. **Monitor Teams**: View team progress, refund points, disable teams
6. **View Logs**: Track all actions and submissions

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email with OTP
- `GET /api/auth/me` - Get current user

### Teams
- `POST /api/teams` - Create team
- `POST /api/teams/{id}/join` - Join team
- `GET /api/teams/{id}` - Get team details
- `GET /api/teams/my/team` - Get current user's team

### Game
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/{id}` - Get room details
- `POST /api/puzzles/{id}/submit` - Submit flag
- `POST /api/clues/{id}/buy` - Purchase clue
- `POST /api/perks/{id}/buy` - Purchase perk
- `POST /api/actions` - Perform attack/defend/invest
- `GET /api/leaderboard` - Get leaderboard

### Admin
- `POST /api/admin/rooms` - Create room
- `POST /api/admin/puzzles` - Create puzzle
- `POST /api/admin/clues` - Create clue
- `GET /api/admin/teams` - List all teams
- `GET /api/admin/logs` - View audit logs
- `POST /api/admin/teams/{id}/refund` - Refund points
- `POST /api/admin/teams/{id}/disable` - Disable team

## Game Mechanics

### Points System
- Teams start with 1000 points (configurable)
- Earn points by solving puzzles
- Spend points on clues, perks, and actions

### Attack Mechanics
- Cost: 50 points
- Effect: Target team cannot submit flags for 5 minutes
- Target gets 3-minute immunity after attack
- Cannot attack teams with active shields

### Defense Mechanics
- Cost: 30 points
- Effect: 10-minute protection from attacks
- Shield must be active to block attacks

### Invest Mechanics
- Invest points in room challenges
- Solve challenge to get 2x return
- Risk/reward strategy

### Room Progression
- Teams must unlock rooms sequentially
- Room 1 is free, others may have unlock costs
- Must solve puzzles to earn points for next room

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Flag hashing with SHA-256 + secret
- Rate limiting on API endpoints
- Server-side flag validation
- Audit logging for all actions
- Role-based access control

## Database Schema

- **users**: User accounts and authentication
- **teams**: Team information and points
- **team_members**: Team membership records
- **rooms**: Game rooms/levels
- **puzzles**: Challenges within rooms
- **clues**: Purchasable hints
- **perks**: Shop items
- **purchases**: Purchase history
- **actions**: Attack/defend/invest records
- **submissions**: Flag submission attempts
- **audit_logs**: System audit trail

## Configuration

### Backend Configuration
Edit `backend/auth.py`:
- `SECRET_KEY`: Change for production
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

### Frontend Configuration
Edit `frontend/vite.config.js`:
- Proxy settings for API
- Port configuration

## Development Notes

- OTP codes are logged to console in development
- Default starting points: 1000 per team
- Attack duration: 5 minutes
- Shield duration: 10 minutes
- Immunity duration: 3 minutes after attack

## Production Deployment

1. Change `SECRET_KEY` in `backend/auth.py`
2. Set up proper email service for OTP delivery
3. Use PostgreSQL instead of SQLite
4. Enable HTTPS/TLS
5. Set up proper CORS origins
6. Configure rate limiting appropriately
7. Set up WebSocket scaling with Redis

## License

MIT License
