# CTF Platform - Documentation Index

Welcome to the CTF Platform! This index will help you find the right documentation for your needs.

## 🚀 Getting Started (Start Here!)

### New Users
1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick commands and test data
2. **[GETTING_STARTED.md](GETTING_STARTED.md)** - Step-by-step tutorial
3. **[SETUP.md](SETUP.md)** - Installation instructions

### Quick Start
- **Windows**: Run `start.bat`
- **Linux/Mac**: Run `./start.sh`
- **URLs**: Frontend at http://localhost:3000, Backend at http://localhost:8000
- **Admin**: admin@ctf.com / admin123

## 📖 Documentation Files

### For Players & Organizers
- **[README.md](README.md)** - Complete feature documentation, usage guide, and API reference
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Tutorial with examples and test scenarios
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick commands, flags, and common tasks

### For Developers
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Code architecture and file organization
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete feature list and statistics
- **[SETUP.md](SETUP.md)** - Development environment setup

### For System Administrators
- **[README.md](README.md)** - Production deployment section
- **[SETUP.md](SETUP.md)** - Configuration and troubleshooting

## 📂 Project Structure

```
ctf-platform/
├── backend/              # FastAPI backend
│   ├── main.py          # Application entry
│   ├── models.py        # Database models
│   ├── routers/         # API endpoints
│   └── seed_data.py     # Initial data
├── frontend/            # React frontend
│   └── src/
│       ├── pages/       # Page components
│       └── context/     # Global state
└── docs/                # This documentation
```

## 🎯 Find What You Need

### "I want to start using the platform"
→ [GETTING_STARTED.md](GETTING_STARTED.md)

### "I need quick commands and test flags"
→ [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### "I'm having installation issues"
→ [SETUP.md](SETUP.md)

### "I want to understand all features"
→ [README.md](README.md)

### "I want to modify the code"
→ [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

### "I want to see what's implemented"
→ [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

### "I want API documentation"
→ http://localhost:8000/docs (after starting backend)

## 🔑 Essential Information

### Default Credentials
```
Email: admin@ctf.com
Password: admin123
```

### Test Flags
```
flag{welcome_to_ctf}
flag{4}
flag{crypto_is_fun}
flag{base64_decoded}
```

### Key URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📋 Common Tasks

### First Time Setup
1. Run startup script (`start.bat` or `start.sh`)
2. Wait for servers to start
3. Open http://localhost:3000
4. Login with admin credentials

### Create Test Environment
1. Sign up 3-4 player accounts
2. Create 2-3 teams
3. Solve some puzzles
4. Test attack/defend features
5. Monitor from admin panel

### Reset Everything
```bash
# Stop servers (Ctrl+C)
cd backend
rm ctf_platform.db
python seed_data.py
# Restart servers
```

## 🎓 Learning Path

### Beginner
1. Read [GETTING_STARTED.md](GETTING_STARTED.md)
2. Run the platform
3. Create account and team
4. Solve Room 1 puzzles
5. Try buying clues

### Intermediate
1. Read [README.md](README.md)
2. Test all features
3. Use admin panel
4. Create custom rooms/puzzles
5. Test attack/defend mechanics

### Advanced
1. Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
2. Understand code architecture
3. Modify configurations
4. Add custom features
5. Deploy to production

## 🛠️ Development Workflow

### Making Changes
1. Understand current structure: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
2. Find relevant files
3. Make modifications
4. Test changes
5. Update documentation

### Adding Features
1. Backend: Add models, routes, schemas
2. Frontend: Add pages, components
3. Test integration
4. Update seed data if needed
5. Document changes

### Debugging
1. Check browser console (frontend)
2. Check terminal logs (backend)
3. Review [SETUP.md](SETUP.md) troubleshooting
4. Check API docs at /docs
5. Review audit logs in admin panel

## 🔒 Security Checklist

### Development
- ✅ Default SECRET_KEY (change for production)
- ✅ SQLite database (upgrade for production)
- ✅ Console OTP logging (email service for production)
- ✅ CORS localhost only (configure for production)

### Production
- ⚠️ Change SECRET_KEY in auth.py
- ⚠️ Use PostgreSQL instead of SQLite
- ⚠️ Set up email service for OTP
- ⚠️ Enable HTTPS/TLS
- ⚠️ Configure proper CORS origins
- ⚠️ Set up monitoring and logging
- ⚠️ Use environment variables

## 📊 Feature Overview

### Core Features
- ✅ Authentication with email verification
- ✅ Team management with invite codes
- ✅ 5 sequential rooms with puzzles
- ✅ Flag submission and validation
- ✅ Clue purchasing system
- ✅ Perk shop with tools/defense/attack
- ✅ Attack/Defend/Invest mechanics
- ✅ Real-time leaderboard
- ✅ Admin panel with full control
- ✅ Audit logging
- ✅ WebSocket real-time updates

### Technical Features
- ✅ FastAPI backend
- ✅ React frontend
- ✅ SQLite database
- ✅ JWT authentication
- ✅ WebSocket support
- ✅ Rate limiting
- ✅ Input validation
- ✅ Security best practices

## 🎉 Quick Wins

### 5-Minute Test
1. Run `start.bat` or `start.sh`
2. Open http://localhost:3000
3. Login: admin@ctf.com / admin123
4. Explore admin panel
5. Create test account
6. Form team and solve puzzle

### 15-Minute Demo
1. Create 2 teams with different accounts
2. Have both teams solve Room 1
3. Buy clues and perks
4. Attack one team from another
5. Activate shield
6. Watch leaderboard update
7. Check admin panel logs

### 30-Minute Customization
1. Add new room via admin panel
2. Create custom puzzles
3. Add clues with hints
4. Modify starting points
5. Change attack/defend costs
6. Test all changes

## 📞 Support Resources

### Documentation
- All .md files in root directory
- Inline code comments
- API documentation at /docs

### Code Examples
- Seed data: `backend/seed_data.py`
- Sample puzzles and clues included
- Pre-configured perks

### Community
- Check GitHub issues (if applicable)
- Review code comments
- Explore API documentation

## ✨ Next Steps

1. **Run the platform** - Use startup scripts
2. **Read documentation** - Start with GETTING_STARTED.md
3. **Test features** - Try all game mechanics
4. **Customize** - Add your own content
5. **Deploy** - Follow production guidelines

---

**Ready to start? Run the startup script and open http://localhost:3000!**

For detailed information on any topic, refer to the specific documentation file listed above.
