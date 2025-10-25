# Project Structure

```
ctf-platform/
├── backend/                      # FastAPI Backend
│   ├── main.py                  # Application entry point
│   ├── database.py              # Database configuration
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic schemas
│   ├── auth.py                  # Authentication utilities
│   ├── middleware.py            # Rate limiting middleware
│   ├── websocket_manager.py    # WebSocket connection manager
│   ├── seed_data.py            # Database seeding script
│   ├── requirements.txt         # Python dependencies
│   └── routers/                 # API route handlers
│       ├── auth.py             # Authentication endpoints
│       ├── teams.py            # Team management endpoints
│       ├── game.py             # Game logic endpoints
│       ├── admin.py            # Admin panel endpoints
│       └── websocket.py        # WebSocket endpoints
│
├── frontend/                     # React Frontend
│   ├── index.html              # HTML entry point
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── src/
│   │   ├── main.jsx           # React entry point
│   │   ├── App.jsx            # Main app component
│   │   ├── index.css          # Global styles
│   │   ├── context/           # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── components/        # Reusable components
│   │   │   └── Navbar.jsx
│   │   └── pages/             # Page components
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── VerifyEmail.jsx
│   │       ├── Dashboard.jsx
│   │       ├── TeamManagement.jsx
│   │       ├── RoomView.jsx
│   │       ├── Shop.jsx
│   │       ├── Leaderboard.jsx
│   │       └── AdminPanel.jsx
│
├── README.md                    # Main documentation
├── SETUP.md                     # Setup instructions
├── PROJECT_STRUCTURE.md         # This file
├── .gitignore                   # Git ignore rules
├── start.bat                    # Windows startup script
└── start.sh                     # Linux/Mac startup script
```

## Backend Architecture

### Core Files

**main.py**
- FastAPI application initialization
- CORS middleware configuration
- Router registration
- Lifespan events for database setup

**database.py**
- SQLAlchemy engine configuration
- Session management
- Database connection utilities

**models.py**
- SQLAlchemy ORM models
- Database schema definitions
- Relationships between tables

**schemas.py**
- Pydantic models for request/response validation
- Data transfer objects (DTOs)
- Type safety for API

**auth.py**
- JWT token generation and validation
- Password hashing with bcrypt
- OTP generation
- Flag hashing for security
- Authentication dependencies

**middleware.py**
- Rate limiting implementation
- Request throttling
- IP-based rate limiting

**websocket_manager.py**
- WebSocket connection management
- Real-time message broadcasting
- Team-specific channels
- Leaderboard updates

**seed_data.py**
- Initial database population
- Sample rooms, puzzles, clues
- Admin user creation
- Perk definitions

### API Routers

**routers/auth.py**
- User registration
- Email verification with OTP
- Login/logout
- Token management

**routers/teams.py**
- Team creation
- Team joining with invite codes
- Member management
- Team information retrieval

**routers/game.py**
- Room access and progression
- Flag submission and validation
- Clue and perk purchasing
- Attack/defend/invest actions
- Leaderboard generation

**routers/admin.py**
- Room CRUD operations
- Puzzle CRUD operations
- Clue creation
- Team management (refund, disable)
- Audit log viewing

**routers/websocket.py**
- WebSocket connection handling
- Real-time event streaming
- Team-specific channels

## Frontend Architecture

### Core Files

**main.jsx**
- React application bootstrap
- Root component rendering

**App.jsx**
- React Router configuration
- Route definitions
- Protected route wrappers
- Admin route guards

**index.css**
- Global CSS styles
- Utility classes
- Component base styles
- Responsive design

### Context

**AuthContext.jsx**
- Global authentication state
- User information management
- Login/logout functions
- Token storage
- API authentication headers

### Components

**Navbar.jsx**
- Navigation menu
- User information display
- Logout functionality
- Role-based menu items

### Pages

**Login.jsx**
- User login form
- Error handling
- Redirect after login

**Signup.jsx**
- User registration form
- Email validation
- Password requirements

**VerifyEmail.jsx**
- OTP input form
- Email verification
- Resend OTP functionality

**Dashboard.jsx**
- Team overview
- Room listing
- Quick navigation
- Points display

**TeamManagement.jsx**
- Team creation modal
- Team joining modal
- Member list
- Invite code display

**RoomView.jsx**
- Puzzle display
- Flag submission
- Clue purchasing
- Room unlocking

**Shop.jsx**
- Perk catalog
- Purchase functionality
- Points balance display
- Perk filtering

**Leaderboard.jsx**
- Real-time team rankings
- Attack buttons
- Shield activation
- Team status indicators

**AdminPanel.jsx**
- Tabbed interface
- Room management
- Puzzle creation
- Team monitoring
- Audit log viewer

## Database Schema

### Tables

1. **users** - User accounts
2. **teams** - Team information
3. **team_members** - Team membership
4. **rooms** - Game rooms/levels
5. **puzzles** - Challenges
6. **clues** - Purchasable hints
7. **perks** - Shop items
8. **purchases** - Purchase history
9. **actions** - Attack/defend/invest records
10. **submissions** - Flag attempts
11. **audit_logs** - System audit trail
12. **leaderboard_snapshots** - Historical rankings

## API Flow

### Authentication Flow
1. User signs up → OTP sent
2. User verifies email with OTP
3. User logs in → JWT token issued
4. Token stored in localStorage
5. Token sent in Authorization header
6. Backend validates token on each request

### Game Flow
1. User creates/joins team
2. Team starts in Room 1
3. Team solves puzzles → earns points
4. Team spends points on clues/perks
5. Team unlocks next room
6. Repeat until Room 5 completed

### Attack Flow
1. Captain selects target team
2. Attack action created (50 points)
3. Target team blocked from submissions (5 min)
4. Target team gets immunity (3 min)
5. WebSocket notifies target team
6. Audit log records action

### Real-time Updates
1. Action occurs (flag submit, purchase, attack)
2. Backend broadcasts via WebSocket
3. Frontend receives update
4. UI updates automatically
5. Leaderboard refreshes

## Security Measures

1. **Password Security**: Bcrypt hashing
2. **Flag Security**: SHA-256 + secret key
3. **Token Security**: JWT with expiration
4. **Rate Limiting**: Per-IP request throttling
5. **Input Validation**: Pydantic schemas
6. **SQL Injection**: ORM parameterization
7. **CORS**: Configured origins
8. **Role-Based Access**: Admin endpoints protected

## Extensibility

### Adding New Rooms
1. Use Admin Panel → Create Content → Room
2. Set order_index, unlock_cost
3. Add puzzles to room
4. Add clues to puzzles

### Adding New Perks
1. Define perk in Admin Panel or seed_data.py
2. Set cost, type, effect_json
3. Implement effect logic in game.py

### Adding New Actions
1. Add action type to ActionCreate schema
2. Implement logic in game.py perform_action
3. Update audit logging
4. Add UI controls in frontend

### Customizing Points
- Starting points: models.py Team.points_balance
- Puzzle rewards: Admin Panel or seed_data.py
- Action costs: game.py perform_action
- Clue costs: Admin Panel or seed_data.py

## Performance Considerations

1. **Database Indexing**: Email, team_id, room_id indexed
2. **Query Optimization**: Eager loading with relationships
3. **Caching**: Consider Redis for leaderboard
4. **WebSocket Scaling**: Use Redis Pub/Sub for multi-instance
5. **Rate Limiting**: Prevent abuse and DoS
6. **Connection Pooling**: SQLAlchemy session management

## Future Enhancements

- [ ] Email service integration (SendGrid, AWS SES)
- [ ] PostgreSQL migration
- [ ] Redis caching layer
- [ ] File upload for puzzles
- [ ] Team chat functionality
- [ ] Spectator mode
- [ ] Event scheduling
- [ ] Multi-event support
- [ ] Advanced analytics dashboard
- [ ] Mobile responsive improvements
- [ ] Dark mode
- [ ] Internationalization (i18n)
