# CTF Platform - Visual Execution Guide

## 📊 Feature Timeline & Dependencies

```
PHASE 1: SCHEMA
┌─────────────────────────────────────┐
│ Update convex/schema.ts             │
│ - Add challenge-related fields      │
│ - Add cooldown/immunity fields      │
│ - Add challengeAttempts table       │
│                                     │
│ ⏱️  TIME: 30 mins                   │
│ 🔧 FILES: schema.ts only           │
└──────────────────┬──────────────────┘
                   │ MUST COMPLETE
                   ▼
PHASE 2: UNIQUE TEAM NAMES
┌─────────────────────────────────────┐
│ Add unique constraint to teams      │
│ - Check .index("by_name")           │
│ - Validation helper                 │
│ - Error handling                    │
│                                     │
│ ⏱️  TIME: 30 mins                   │
│ 🔧 FILES: teams.ts, utils.ts       │
└──────────────────┬──────────────────┘
                   │ MUST COMPLETE
                   ▼
PHASE 3: ENHANCED SHIELD
┌─────────────────────────────────────┐
│ Shield system improvements          │
│ - Prevent multiple buys             │
│ - Prevent during attacks            │
│ - 5-min countdown timer             │
│                                     │
│ ⏱️  TIME: 1 hour                    │
│ 🔧 FILES: game.ts, Dashboard.jsx   │
└──────────────────┬──────────────────┘
                   │ CHECKPOINT: All features so far tested & working
                   │
      ┌────────────┴────────────┬────────────┐
      │                         │            │
      ▼                         ▼            ▼
  TRACK A                  TRACK B          TRACK C
  (Challenge)             (Attack)      (Terminology)
  
  PHASE 4 & 5          PHASE 6 & 7         PHASE 8
  
  ┌────────────┐      ┌────────────┐    ┌─────────┐
  │ Challenge  │      │  Cooldown  │    │ Rename  │
  │ Backend    │      │  System    │    │Puzzles→ │
  │ 3 hours    │      │  1.5 hours │    │Challenges
  │            │      │            │    │ 30 mins │
  └────────────┘      └────────────┘    └─────────┘
       │                    │
       │ MERGE              │ MERGE
       │                    │ MERGE
       ▼                    ▼
  PHASE 5 & 7           MERGE
  Media + Layout    (30 mins merge)
  + Sidebar         
  2.5 hours             ▼
     │            ┌──────────────┐
     └────────────│  All features│
                  │  integrated  │
                  └──────┬───────┘
                         │
                         ▼
                    PHASE 9: TESTING
                    ┌─────────────────────────────────┐
                    │ Integration & concurrency tests │
                    │ - 5 teams scenario              │
                    │ - 50+ concurrent operations     │
                    │ - Edge cases & error handling   │
                    │                                 │
                    │ ⏱️  TIME: 2 hours               │
                    │ 🔧 FILES: All (verification)   │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                        PHASE 10: DEPLOY
                        ┌─────────────────────────────────┐
                        │ Production deployment           │
                        │ - Backup DB                     │
                        │ - Deploy to Render              │
                        │ - Verify real-time updates      │
                        │ - Monitor for errors            │
                        │                                 │
                        │ ⏱️  TIME: 1 hour                │
                        └─────────────────────────────────┘
```

---

## 🚀 How to Execute

### DAY 1: Foundation (2-3 hours)

**Morning: Phase 1 + 2**
```
9:00 AM  - Read DEVELOPMENT_PLAN.md Phase 1
9:15 AM  - Update convex/schema.ts (copy-paste code)
9:30 AM  - Deploy schema: npx convex dev
9:45 AM  - Test: No errors in Convex dashboard ✓

10:00 AM - Read DEVELOPMENT_PLAN.md Phase 2
10:15 AM - Update convex/teams.ts (validation check)
10:30 AM - Test: Try creating duplicate team → Error ✓

11:00 AM - Coffee break ☕

11:15 AM - Read DEVELOPMENT_PLAN.md Phase 3
11:30 AM - Update convex/game.ts (shield logic)
12:00 PM - Update src/pages/Dashboard.jsx (timer)
12:30 PM - Test: Buy shield, see 5-min countdown ✓
1:00 PM  - Commit: "Complete Phases 1-3"
```

### DAY 1 Afternoon: Parallelization Begins

**After Phase 3, split into teams**:

**TRACK A (You)**: Challenge Questions (Phases 4-5)
```
2:00 PM  - Read DEVELOPMENT_PLAN.md Phase 4
2:15 PM  - Update convex/game.ts (startChallengeAttempt, etc.)
2:45 PM  - Update convex/schema.ts (challengeAttempts table)
3:15 PM  - Test: Start challenge → points deducted ✓
3:45 PM  - Coffee break ☕
4:00 PM  - Read DEVELOPMENT_PLAN.md Phase 5
4:15 PM  - Create src/components/ChallengeGrid.jsx
4:45 PM  - Create src/components/ChallengeDetail.jsx
5:15 PM  - Update src/pages/RoomView.jsx
5:45 PM  - Update src/pages/AdminPanel.jsx (media fields)
6:15 PM  - Test: Create challenge, upload media ✓
6:30 PM  - Commit: "Complete Phases 4-5: Challenge system"
```

**TRACK B (Team member)**: Attack System (Phases 6-7)
```
2:00 PM  - Read DEVELOPMENT_PLAN.md Phase 6
2:15 PM  - Update convex/game.ts (cooldown logic)
2:45 PM  - Update convex/schema.ts (lastAttackTime field)
3:15 PM  - Update src/pages/Leaderboard.jsx (cooldown display)
3:45 PM  - Test: Attack → cooldown timer shows ✓
4:00 PM  - Read DEVELOPMENT_PLAN.md Phase 7
4:15 PM  - Create src/components/LeaderboardSidebar.jsx
4:45 PM  - Update src/pages/Dashboard.jsx (sidebar toggle)
5:15 PM  - Update src/index.css (sidebar styles)
5:45 PM  - Test: Sidebar opens/closes smoothly ✓
6:30 PM  - Commit: "Complete Phases 6-7: Attack & sidebar"
```

**TRACK C (Team member)**: Terminology (Phase 8)
```
2:00 PM  - Read DEVELOPMENT_PLAN.md Phase 8
2:15 PM  - Find & replace: "Puzzle" → "Challenge" (UI only)
2:45 PM  - Check all files: src/pages/*.jsx, src/components/*.jsx
3:15 PM  - Test: Build passes, no console errors ✓
3:30 PM  - Commit: "Complete Phase 8: Terminology update"
```

### DAY 2: Integration & Deployment (1-2 hours)

**Morning: Phase 9 Testing**
```
9:00 AM  - Read DEVELOPMENT_PLAN.md Phase 9
9:30 AM  - Manual integration testing:
          - Create 2 teams
          - Complete rooms, buy shields, attack
          - Start challenges, submit flags
          - Check leaderboard, attack cooldown, immunity
10:30 AM - Concurrent testing:
          - Open 5 browser tabs (5 different teams)
          - All submit flags simultaneously
          - All buy shields
          - All attack different teams
10:45 AM - Verify: No errors, all points awarded ✓
11:00 AM - Check audit logs for all actions
11:30 AM - All tests passed! Ready for deploy.
```

**Afternoon: Phase 10 Deployment**
```
2:00 PM  - Read DEVELOPMENT_PLAN.md Phase 10
2:15 PM  - Backup: Request Convex snapshot
2:30 PM  - Verify render.yaml configured
2:45 PM  - Deploy: git push origin main
3:00 PM  - Monitor Render: Check logs for errors
3:15 PM  - Smoke test: Login, create team, play
3:30 PM  - Check real-time updates: Leaderboard updates ✓
3:45 PM  - Document: What works, what to monitor
4:00 PM  - Announce launch! 🎉
```

---

## ✅ Checkpoint Checklist

### After Phase 3 (MUST PASS)
- [ ] Schema deployed, no errors
- [ ] Can't create duplicate team names
- [ ] Shield prevents multiple buys
- [ ] Shield timer counts down
- [ ] npm run build passes

### After Phases 4-5 (MUST PASS)
- [ ] Challenge questions create successfully
- [ ] Investment deducted on start
- [ ] Timer starts and counts down
- [ ] Flag submission awards 2x points if correct
- [ ] Media displays in challenge detail
- [ ] npm run build passes

### After Phases 6-7 (MUST PASS)
- [ ] Attack cooldown enforced (5 min)
- [ ] Target gets immunity
- [ ] Leaderboard sidebar opens/closes
- [ ] Sidebar shows live leaderboard
- [ ] npm run build passes

### After Phase 8 (MUST PASS)
- [ ] UI says "Challenge" instead of "Puzzle"
- [ ] All terminology consistent
- [ ] npm run build passes

### After Phase 9 (MUST PASS)
- [ ] 5 teams playing simultaneously
- [ ] No errors in console
- [ ] All points calculated correctly
- [ ] Audit logs complete
- [ ] No race conditions observed

### After Phase 10 (MUST PASS)
- [ ] Production site loads
- [ ] Real users can login
- [ ] Real-time features work
- [ ] Leaderboard updates live
- [ ] No 500 errors

---

## 🐛 Troubleshooting Guide

### Problem: "Schema updated but queries fail"
**Solution**: Restart Convex dev
```bash
npx convex dev  # Stop with Ctrl+C
npx convex dev  # Start again
```

### Problem: "Unique team name check not working"
**Solution**: Verify index exists in schema
```typescript
// In schema.ts:
teams: defineTable({
  // ...
  name: v.string(),
})
  .index("by_name", ["name"])  // ← This line is required
```

### Problem: "Timer doesn't countdown"
**Solution**: Check interval cleanup
```javascript
// useEffect must include cleanup
useEffect(() => {
  if (!team?.shieldActive) return;
  
  const interval = setInterval(() => { ... }, 1000);
  return () => clearInterval(interval);  // ← Cleanup is critical
}, [team?.shieldExpiry]);
```

### Problem: "Multiple shield purchases allowed"
**Solution**: Check order of validation in performAction
```typescript
// Must check BEFORE deducting points
if (team.shieldActive && team.shieldExpiry > now) {
  throw new ConvexError("Shield already active");  // ← Check first
}
// ... then deduct and activate
```

### Problem: "Build fails with TypeScript errors"
**Solution**: Check mutation arg types match schema
```typescript
// Schema: pointsBalance: v.number()
// Mutation arg: pointsBalance: v.number()  // ← Must match

// ❌ Common mistake: pointsBalance: "100" (string)
// ✅ Correct: pointsBalance: 100 (number)
```

---

## 📱 Real-World Testing Scenarios

### Scenario 1: Normal gameplay (Happy path)
```
1. Alice creates team "Alpha" ✓
2. Alpha completes Room 1, Room 2
3. Alpha enters Room 3, sees 5 challenges
4. Clicks "Medium Difficulty Challenge"
5. Spends 50 pts to start (investment)
6. Timer shows 10 minutes
7. Submits correct flag in 5 minutes
8. Receives 200 pts (2x multiplier) ✓
9. Leaderboard updates in real-time ✓
```

### Scenario 2: Attack & defense
```
1. Beta team checks leaderboard
2. Clicks "Attack" on Alpha (costs 50 pts)
3. Alpha loses 50 pts, gets immunity for 5 min
4. Beta gets cooldown: "Cooldown: 4m 59s" on button
5. Beta tries to attack again → "Cooldown active" ✓
6. Alpha buys shield (costs 30 pts)
7. Shows "🛡️ Shield: 4m 58s" countdown
8. Try to attack Alpha → "Cannot attack, immunity active" ✓
9. After 5 min, immunity expires
10. After 5 min, Beta cooldown expires
```

### Scenario 3: Concurrent operations
```
1. 5 teams open at same time
2. All 5 attempt to create team "Alpha"
3. Result: Only 1 succeeds, 4 get "Name taken" ✓
4. All 5 submit flags to same puzzle
5. All 5 calculations complete correctly ✓
6. All 5 appear in leaderboard ✓
7. No lost updates or corruption ✓
```

### Scenario 4: Challenge failure
```
1. Team starts challenge (10 min timer, 50 pts investment)
2. Spends 8 minutes solving
3. Timer expires with 2 min remaining
4. Alert: "⏰ Challenge failed. 50 pts investment lost."
5. Challenge attempt marked complete ✓
6. Team can start again (new investment required)
```

---

## 🔧 Development Commands

### Local Development
```bash
# Start frontend dev server
npm run dev

# Start Convex backend
npx convex dev

# Both in separate terminals (recommended)
```

### Building & Testing
```bash
# Build for production
npm run build

# Verify no errors
npm run build 2>&1 | grep -i error

# Run TypeScript check
npx tsc --noEmit
```

### Git Workflow
```bash
# Commit after each phase
git add -A
git commit -m "Complete Phase X: Feature name"

# Push to deploy
git push origin main  # Auto-deploys to Render if configured
```

### Debugging
```bash
# Check Convex logs
convex logs

# Open Convex dashboard
convex dashboard

# Watch schema changes
npx convex codegen --watch
```

---

## 📈 Success Metrics

After full deployment, measure:

| Metric | Target | How to Check |
|--------|--------|-------------|
| Response time | < 200ms | Browser DevTools Network tab |
| Multi-team sync | 0 desync | 5 teams, verify same leaderboard |
| Error rate | 0% | Check Convex logs |
| Points calculation | 100% accurate | Random audit of team scores |
| Timer accuracy | ±1 sec | Start challenge, watch timer |
| Feature coverage | 100% | All 8 features working |

---

## 🎯 Final Deliverables

After Phase 10, you have:

✅ **Unique team names** - No duplicates, validated at DB level
✅ **Enhanced shields** - Can't buy twice, 5-min countdown
✅ **Challenge questions** - Premium feature with timers & multipliers
✅ **Rich media** - Images, files, links in challenges
✅ **LeetCode layout** - Professional-looking challenge display
✅ **Attack cooldown** - 5-min cooldown + immunity system
✅ **Leaderboard sidebar** - Real-time, collapsible, tier-based
✅ **Updated terminology** - "Challenges" instead of "Puzzles"
✅ **Production-ready** - Multi-team safe, audited, error-handled
✅ **Fully documented** - 4 guides + code comments

---

## 🚀 Launch Day Checklist

```bash
BEFORE GOING LIVE:
☐ All tests pass locally
☐ Build succeeds: npm run build
☐ Render env variables set
☐ Database backup taken
☐ Error handling verified
☐ Audit logs enabled
☐ Admin panel tested

DURING LAUNCH:
☐ git push origin main
☐ Monitor Render deployment
☐ Check Convex logs
☐ Smoke test with real account
☐ Announce to users

AFTER LAUNCH:
☐ Monitor for 2 hours
☐ Check leaderboard updates
☐ Verify timers working
☐ Document any issues
☐ Celebrate! 🎉
```

---

**You've got this! 💪**

Refer to this guide when executing. Each phase is clear, testable, and independent. No guessing, no ambiguity.

Good luck! 🚀

