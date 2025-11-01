# 🎯 CTF Platform - Convergence

A real-time, multiplayer **Capture The Flag (CTF)** competition platform built with **React**, **Convex**, and modern web technologies. Teams compete to solve challenges, progress through rooms, and dominate the leaderboard while defending against attacks from rival teams.

---

## 🌟 Features

### 🏆 Core Gameplay
- **Multi-Room Progression**: Teams unlock and progress through sequential rooms (Lobby → Server Room → CEO Office)
- **Challenge-Based System**: Solve challenges to earn points and unlock new rooms
- **Real-Time Leaderboard**: Live rankings grouped by room tier with shield/immunity indicators
- **Team Management**: Create teams (2-5 members), invite players, and manage your squad
- **Attack & Defense Mechanics**: Attack rival teams, buy shields, and strategically defend your points

### ⚡ Challenge System
- **LeetCode-Style Interface**: Professional challenge grid with difficulty badges
- **Rich Media Support**: Challenges can include:
  - 📷 Images
  - 📎 Downloadable files
  - 🔗 External links
  - 📚 Topic categorization (Cryptography, Web Security, etc.)
- **Difficulty Levels**: Very Easy → Very Hard with color-coded indicators
- **Premium Challenge Questions**: 
  - Timed challenges (configurable timer)
  - Investment required (50% of points reward)
  - 2x point multiplier on success
  - Live countdown timer
  - High-risk, high-reward gameplay

### 🛡️ Enhanced Shield System
- **5-Minute Duration**: Active protection with real-time countdown
- **Smart Restrictions**: 
  - Can't purchase multiple shields
  - Can't activate while under attack
  - Visual timer display on dashboard
- **Strategic Defense**: Protect your points from attackers

### ⚔️ Attack Mechanics
- **5-Minute Cooldown**: Prevents spam attacks
- **Immunity System**: Target receives 5-minute immunity after being attacked
- **Cost-Benefit Analysis**: 50 points to attack, potential 50-point gain from target
- **Real-Time Status**: See attack cooldown timers and immunity indicators

### 📊 Leaderboard Features
- **Half-Collapsible Sidebar**: Smooth slide-in/out animation
- **Room Tier Grouping**: Teams organized by their highest room reached
- **Live Updates**: Real-time synchronization via Convex subscriptions
- **Visual Indicators**: 
  - 🛡️ Shield active
  - ✨ Immunity active
  - 🥇 🥈 🥉 Top 3 badges
  - Highlight your own team

### 👨‍💼 Admin Panel
- **Room Management**: Create, edit, activate/deactivate rooms
- **Challenge Creation**: 
  - Set difficulty, topic, points reward
  - Add images, files, and links
  - Configure challenge timers and multipliers
  - Upload media via URL
- **Clue System**: Create purchasable hints for challenges
- **Perk Shop**: Manage tools, defense items, and attack options
- **Audit Logs**: Track all team actions and submissions

### 🔒 Security & Data Integrity
- **Unique Team Names**: Database-level constraint prevents duplicates
- **Rate Limiting**: Prevents flag submission spam and exploit attempts
- **Secure Flag Hashing**: SHA-256 with salt
- **Concurrent Team Safety**: Atomic transactions via Convex
- **Real-Time Validation**: Frontend and backend validation layers

---

## 🚀 Tech Stack

### Frontend
- **React 18**: Modern component-based UI
- **React Router v6**: Client-side routing
- **Convex React**: Real-time data hooks (useQuery, useMutation)
- **React Hot Toast**: Beautiful notifications
- **CSS3**: Custom styling with gradients, shadows, animations

### Backend
- **Convex**: Real-time database and serverless functions
- **TypeScript**: Type-safe backend mutations and queries
- **Convex Schema**: Strongly-typed database tables
- **Crypto API**: Secure flag hashing (SHA-256)

### Deployment
- **Render**: Frontend and backend hosting
- **Convex Cloud**: Database and real-time sync
- **Environment Variables**: Secure configuration

---

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Convex account (https://convex.dev)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd CTF---Convergence
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Convex
```bash
npx convex dev
```
This will:
- Create a new Convex project (or link to existing)
- Generate API endpoints
- Deploy schema

### Step 4: Set Environment Variables
Create `.env` file:
```
VITE_CONVEX_URL=<your-convex-url>
```

### Step 5: Seed Data (Optional)
```bash
npx convex run seed_data:seedAll
```

### Step 6: Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 🎮 How to Play

### For Players

#### 1. **Register & Create/Join Team**
- Sign up with email and password
- Create a new team (2-5 members) or join via invite code
- Team captain has special permissions

#### 2. **Solve Challenges**
- Navigate to available rooms from Dashboard
- View challenges in grid layout
- Click a challenge to see:
  - Description and media
  - Difficulty and topic
  - Points reward
  - Timer (for premium challenges)
- Submit flags to earn points

#### 3. **Premium Challenges**
- Click "Start Challenge" button
- Invest 50% of points reward upfront
- Timer starts (e.g., 10 minutes)
- Submit flag within time limit
- Success = 2x points | Failure = Investment lost

#### 4. **Attack & Defend**
- View leaderboard to see rival teams
- Click "Attack" on a team (costs 50 pts)
- Target loses points and gains 5-min immunity
- You go on 5-min cooldown
- Buy shield (30 pts) for 5-min protection

#### 5. **Progress Through Rooms**
- Complete challenges to earn points
- Unlock next room (costs points)
- Advance through: Lobby → Server Room → CEO Office

### For Admins

#### 1. **Access Admin Panel**
- Login with admin account
- Navigate to `/admin`

#### 2. **Create Rooms**
- Set name, description, order
- Configure unlock cost
- Add room brief (story text)

#### 3. **Create Challenges**
- Select room and set title/description
- Enter flag answer
- Set points reward and difficulty
- **Optional - Challenge Mode:**
  - Check "Is Challenge Question"
  - Set timer (minutes)
  - Set points multiplier (e.g., 2x)
- **Add Media:**
  - Image URLs (comma-separated)
  - File URLs (JSON: `[{"name": "file.zip", "url": "..."}]`)
  - External Links (JSON: `[{"title": "Docs", "url": "..."}]`)

#### 4. **Create Clues**
- Select challenge
- Write clue text
- Set cost (points)
- Set order index

#### 5. **Manage Perks**
- Create shop items
- Set effect (JSON)
- Mark as tool/defense/attack

---

## 🗂️ Project Structure

```
CTF---Convergence/
├── convex/                    # Backend (Convex)
│   ├── schema.ts              # Database schema
│   ├── auth.ts                # Authentication
│   ├── game.ts                # Game logic (challenges, attacks)
│   ├── teams.ts               # Team management
│   ├── admin.ts               # Admin operations
│   ├── routers/               # API routers
│   └── _generated/            # Auto-generated types
├── src/                       # Frontend (React)
│   ├── pages/
│   │   ├── Dashboard.jsx      # Main hub with room grid
│   │   ├── RoomView.jsx       # Challenge grid & detail view
│   │   ├── Leaderboard.jsx    # Full leaderboard page
│   │   ├── AdminPanel.jsx     # Admin CRUD interface
│   │   ├── TeamManagement.jsx # Team settings
│   │   ├── Shop.jsx           # Perk shop
│   │   └── ...
│   ├── components/
│   │   ├── ChallengeGrid.jsx  # Challenge card grid
│   │   ├── ChallengeDetail.jsx# Challenge detail view
│   │   ├── LeaderboardSidebar.jsx # Collapsible sidebar
│   │   └── Navbar.jsx         # Top navigation
│   ├── context/
│   │   └── AuthContext.jsx    # Auth state management
│   ├── App.jsx                # Main app component
│   └── index.css              # Global styles
├── README.md                  # This file
└── package.json               # Dependencies
```

---

## 🛠️ Key Technologies Explained

### Convex Database
- **Real-Time Subscriptions**: Data updates instantly across all clients
- **Atomic Transactions**: Race condition prevention
- **TypeScript Schema**: Type-safe database operations
- **Indexes**: Optimized queries (O(1) lookups)

Example:
```typescript
// Query with real-time updates
const team = useQuery(api.teams.getMyTeam, { userId });

// Mutation with optimistic updates
const submitFlag = useMutation(api.game.submitFlag);
await submitFlag({ userId, puzzleId, flag });
```

### Challenge System Architecture
```
┌─────────────────────────────────────────────┐
│          Challenge Grid (RoomView)          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ Ch1 │ │ Ch2 │ │ Ch3 │ │ Ch4 │           │
│  └─────┘ └─────┘ └─────┘ └─────┘           │
└─────────────────┬───────────────────────────┘
                  │ onClick
                  ▼
┌─────────────────────────────────────────────┐
│       Challenge Detail View (Split)         │
│  ┌──────────────────┐ ┌─────────────────┐  │
│  │ Left Panel       │ │ Right Panel     │  │
│  │ - Description    │ │ - Timer         │  │
│  │ - Images         │ │ - Flag Input    │  │
│  │ - Files          │ │ - Submit Button │  │
│  │ - Links          │ │ - Points Display│  │
│  └──────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────┘
```

### Attack/Defense Flow
```
Team A attacks Team B
  ↓
1. Check Team A cooldown (5 min)
2. Check Team B immunity (5 min)
3. Check Team B shield (5 min)
4. Deduct 50 pts from Team A
5. Deduct 50 pts from Team B
6. Set Team A cooldown (now + 5 min)
7. Set Team B immunity (now + 5 min)
8. Log to audit table
  ↓
Real-time update to leaderboard
```

---

## 📊 Database Schema

### Key Tables

#### `teams`
```typescript
{
  name: string,                    // Unique team name
  pointsBalance: number,           // Current points
  highestRoomId: Id<"rooms">,     // Highest room unlocked
  shieldActive: boolean,           // Shield status
  shieldExpiry: number,            // Shield expiry timestamp
  lastAttackTime: number,          // Last attack timestamp
  immunityUntil: number,           // Immunity expiry timestamp
  nameVerified: boolean            // Unique name flag
}
```

#### `puzzles` (Challenges)
```typescript
{
  title: string,
  description: string,
  flagHash: string,                // SHA-256 hashed
  pointsReward: number,
  isChallenge: boolean,            // Premium challenge flag
  challengeTimerMinutes: number,   // Timer duration
  challengePointsMultiplier: number, // Point multiplier
  topic: string,                   // Category
  difficulty: string,              // very_easy | easy | medium | hard | very_hard
  imageUrls: string[],             // Image URLs
  fileUrls: {name, url}[],         // File downloads
  externalLinks: {title, url}[]    // External links
}
```

#### `challengeAttempts`
```typescript
{
  teamId: Id<"teams">,
  challengeId: Id<"puzzles">,
  startedAt: number,               // Start timestamp
  endsAt: number,                  // End timestamp
  investment: number,              // Points invested
  isCompleted: boolean,            // Attempt finished
  isPassed: boolean,               // Attempt passed
  solvedAt: number                 // Solve timestamp
}
```

#### `actions`
```typescript
{
  teamId: Id<"teams">,
  actionType: "attack" | "defend",
  targetTeamId: Id<"teams">,
  cost: number,
  createdAt: number,
  endsAt: number,
  cooldownUntil: number            // Cooldown expiry
}
```

---

## 🎨 UI/UX Highlights

### Challenge Grid
- **Card-Based Layout**: Responsive grid (300px min per card)
- **Hover Effects**: Smooth transform and glow
- **Difficulty Colors**:
  - Very Easy: Cyan (#0ff)
  - Easy: Green (#0f0)
  - Medium: Yellow (#ff0)
  - Hard: Orange (#ffa500)
  - Very Hard: Red (#f00)
- **Status Badges**: 
  - ⚡ CHALLENGE (premium)
  - ✓ SOLVED

### Challenge Detail
- **Split View**: 50% description | 50% submission
- **Timer**: Live countdown with expiry warning
- **Media Display**: Auto-layout images, file links, external links
- **Responsive**: Adapts to screen size

### Leaderboard Sidebar
- **Slide Animation**: Smooth 0.3s ease transition
- **Room Grouping**: Teams organized by tier
- **Rank Badges**: 🥇 🥈 🥉 for top 3
- **Live Updates**: Real-time via Convex subscriptions

---

## 🔐 Security Measures

### Flag Security
- **SHA-256 Hashing**: Flags never stored in plaintext
- **Salt**: Secret salt added before hashing
- **Validation**: Frontend & backend validation

### Rate Limiting
- **Flag Submissions**: 10 attempts per 5 minutes per challenge
- **Team Creation**: 3 attempts per 60 minutes
- **Attack Actions**: 5-minute cooldown enforced

### Concurrent Access
- **Atomic Transactions**: Convex guarantees serializability
- **Database Indexes**: Prevent race conditions
- **Unique Constraints**: Database-level name uniqueness

### Admin Access
- **Role-Based**: `isAdmin` flag in users table
- **Middleware**: All admin routes protected
- **Audit Logs**: Every action logged with timestamp

---

## 🚢 Deployment

### Render Deployment

#### 1. **Frontend**
```bash
# Build command
npm run build

# Start command
npm run preview

# Environment variables
VITE_CONVEX_URL=<your-convex-url>
```

#### 2. **Backend (Convex)**
```bash
npx convex deploy
```

### Production Checklist
- [ ] Environment variables set
- [ ] Convex project deployed
- [ ] Admin account created
- [ ] Seed data loaded (rooms, challenges)
- [ ] CORS configured
- [ ] Error monitoring enabled
- [ ] Backup strategy in place

---

## 📈 Performance Optimization

### Database Indexes
```typescript
teams:
  - by_name (unique queries)
  - by_captain (team lookup)

puzzles:
  - by_room (room challenges)
  - by_active (active challenges)

challengeAttempts:
  - by_team_and_challenge (active attempt check)
  - by_team_and_completed (completed attempts)

submissions:
  - by_team_and_puzzle (existing submissions)
  - by_team_and_correct (solved challenges)
```

### Query Optimization
- **Use Indexes**: Always query via `.withIndex()`
- **Batch Queries**: Fetch related data in parallel
- **Pagination**: Limit results for large datasets

---

## 🐛 Troubleshooting

### Common Issues

#### **Convex Connection Failed**
- Check `VITE_CONVEX_URL` in `.env`
- Verify Convex project deployed
- Run `npx convex dev` to redeploy

#### **Schema Mismatch**
```bash
# Regenerate types
npx convex codegen

# Redeploy schema
npx convex deploy
```

#### **Shield Not Working**
- Check `shieldExpiry` timestamp
- Verify no active attacks
- Confirm sufficient points

#### **Challenge Timer Not Countdown**
- Check `useEffect` cleanup
- Verify `activeAttempt` query
- Console log `attempt.endsAt`

---

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Make changes
4. Test locally (`npm run dev`)
5. Commit (`git commit -m "Add new feature"`)
6. Push (`git push origin feature/new-feature`)
7. Create Pull Request

### Code Style
- Use ESLint for linting
- Follow Airbnb style guide
- Write meaningful commit messages
- Add comments for complex logic

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 👥 Team

Developed by **GDSC-VNRVJIET** for **Convergence CTF 2025**.

---

## 📞 Support

For issues, questions, or feature requests:
- **GitHub Issues**: Open an issue on the repository
- **Discord**: Join our CTF community server
- **Email**: support@convergence-ctf.com

---

## 🎯 Roadmap

### Upcoming Features
- [ ] Team chat system
- [ ] Hint system (partial clues)
- [ ] Achievement badges
- [ ] Replay mode (view past games)
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Custom room themes
- [ ] Live event streaming
- [ ] Team profiles & stats
- [ ] Challenge difficulty rating

---

## 🙏 Acknowledgments

- **Convex**: For the amazing real-time database
- **React**: For the powerful UI framework
- **CTF Community**: For inspiration and feedback
- **GDSC Team**: For development and testing

---

**Happy Hacking! 🎉**

*"In CTF, every flag is a story. Every challenge is a lesson. Every team is a family."*
