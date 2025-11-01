# CTF Platform - Architecture & Implementation Notes

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard         RoomView        AdminPanel    Leaderboard    │
│  (main hub)       (challenges)      (CRUD)      (real-time)     │
│     │                 │               │             │           │
│  Layout:          Layout:          Layout:      Layout:         │
│  • Room grid   • Challenge grid  • Tabs       • Sidebar        │
│  • Shield     • Media display   • Forms      • Room tiers     │
│  • Status     • Timer           • Uploads    • Scrollable     │
│               • Clues/Flag                                     │
└──────────────────────┬──────────────────────┬───────────────────┘
                       │                      │
                   useQuery()            useMutation()
                       │                      │
┌──────────────────────▼──────────────────────▼───────────────────┐
│             CONVEX BACKEND (TypeScript)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  QUERIES (read-only)          MUTATIONS (write)                │
│  ──────────────────────        ─────────────────                │
│  • getRooms()                  • submitFlag()                   │
│  • getRoom()                   • purchaseClue()               │
│  • getRoomPuzzles()            • startChallengeAttempt()      │
│  • getLeaderboard()            • performAction()              │
│  • getActiveChallengeAttempt() • buyShield()                 │
│  • getChallengeTimer()         • unlockRoom()                │
│  • getPerks()                  • createTeam()                │
│  • ... (read-only)             • ... (write)                 │
│                                                               │
│  HELPERS (utilities)                                          │
│  ─────────────────────                                        │
│  • validateUniqueTeamName()                                   │
│  • checkSubmissionRateLimit()                                 │
│  • getUserTeam()                                              │
│  • isCaptain()                                                │
│  • hashFlag()                                                 │
│                                                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                    Convex RPC
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                   DATABASE (Convex)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CORE TABLES              FEATURE TABLES                        │
│  ────────────             ───────────────                       │
│  users                    purchases                             │
│  teams                    actions                               │
│  teamMembers              challengeAttempts (NEW)              │
│  rooms                    submissions                           │
│  puzzles                  auditLogs                             │
│  clues                    leaderboardSnapshots                  │
│  perks                    teamJoinRequests                      │
│                           rules                                 │
│                                                                  │
│  INDEXES (performance)                                         │
│  ──────────────────────                                        │
│  by_name, by_email, by_team, by_puzzle, etc.                 │
│  Prevents N+1 queries; ensures < 100ms response times          │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### Example 1: Team Submits Challenge Flag

```
┌─ Frontend (RoomView.jsx)
│  1. User clicks "Submit Flag"
│  2. Calls submitFlag({ userId, puzzleId, flag })
│
├─ Backend (game.ts - submitFlag mutation)
│  3. Get team: getUserTeam(ctx, userId)
│  4. Rate limit check: checkSubmissionRateLimit(ctx, teamId, puzzleId)
│  5. Check if challenge attempt active: getActiveChallengeAttempt()
│  6. Hash flag: hashFlag(args.flag)
│  7. Compare with puzzle.flagHash
│  8a. CORRECT:
│      - Award points: if challenge → 2x, else → 1x
│      - Mark submission correct
│      - Update team.pointsBalance
│      - Update team.highestRoomId if needed
│  8b. INCORRECT:
│      - Mark submission incorrect
│      - No points change
│  9. Insert submission record
│  10. Return result
│
└─ Frontend
   11. Show toast: "✓ Correct!" or "✗ Incorrect"
   12. Refresh room/leaderboard
```

### Example 2: Team Buys Shield During Attack

```
┌─ Frontend (Leaderboard.jsx)
│  1. User clicks "Shield" button
│  2. Confirm dialog: "Cost 30 points"
│  3. Calls performAction({ userId, actionType: 'defend' })
│
├─ Backend (game.ts - performAction mutation)
│  4. Get team: getUserTeam(ctx, userId)
│  5. Check 1: team.shieldActive && team.shieldExpiry > now
│     → Error: "Shield already active"
│  6. Check 2: activeAttacks.length > 0 (is team under attack)
│     → Error: "Cannot buy shield while under attack"
│  7. Check 3: team.pointsBalance >= 30
│     → Error: "Insufficient points"
│  8. Pass all checks → Deduct 30 points
│  9. Set shieldActive=true, shieldExpiry=now+5min
│  10. Insert action record (defend type)
│  11. Return success
│
└─ Frontend
   12. Show toast: "✓ Shield activated!"
   13. Show countdown timer: "🛡️ 4m 59s"
   14. Leaderboard updates in real-time (subscription)
```

### Example 3: Challenge Question Attempt

```
┌─ Frontend (RoomView.jsx - Challenge Component)
│  1. User sees "⚡ CHALLENGE QUESTION"
│  2. Clicks "Start Challenge (50 pts)" button
│  3. Calls startChallengeAttempt({ userId, challengeId })
│
├─ Backend (game.ts - startChallengeAttempt mutation)
│  4. Get team
│  5. Get challenge: ctx.db.get(challengeId)
│  6. Verify challenge.isChallenge == true
│  7. Check for active attempt (not already running)
│  8. Calculate investment: challenge.pointsReward * 0.5
│  9. Verify team.pointsBalance >= investment
│  10. Create challengeAttempt record:
│      - startedAt: now
│      - endsAt: now + (challenge.challengeTimerMinutes * 60 * 1000)
│      - isCompleted: false
│  11. Deduct investment from team.pointsBalance
│  12. Return timerMinutes to frontend
│
├─ Frontend (now timer is active)
│  13. Start interval timer: update every 1s
│  14. Display: "⏱️ Time Remaining: 9:47"
│  15. Show flag submission form (right panel)
│
├─ User submits flag (within time limit)
│  16. Calls submitFlag({ userId, puzzleId, flag })
│
├─ Backend (game.ts - submitFlag mutation - challenge logic)
│  17. Check if puzzle.isChallenge == true
│  18. Get active challengeAttempt
│  19. Verify attempt.endsAt > now (still in time)
│  20. Hash & compare flag
│  21. If CORRECT:
│      - Mark challengeAttempt.isPassed = true, solvedAt = now
│      - Award challenge.pointsReward * challenge.pointsMultiplier (e.g., 2x)
│      - Insert "challenge_solved" audit log
│  22. If INCORRECT or TIME EXPIRED:
│      - Investment already deducted in step 11
│      - Award 0 additional points
│  23. Mark challengeAttempt.isCompleted = true
│
└─ Frontend
   24. Show result: "⚡ CHALLENGE SOLVED! +200 pts (2x multiplier)"
       or "⏰ Time's up! Challenge failed."
```

---

## Schema Change Implementation Notes

### Adding a New Field (Example: `nameVerified`)

**Step 1**: Update schema.ts
```typescript
teams: defineTable({
  // ... existing fields
  name: v.string(),
  nameVerified: v.boolean(), // Add this line
  // ... rest
})
```

**Step 2**: No migration needed - Convex automatically allows missing optional fields. But make it non-optional:
```typescript
nameVerified: v.boolean(), // Will default to false for existing teams (careful!)
```

**Alternative - Optional**: 
```typescript
nameVerified: v.optional(v.boolean()), // Existing teams won't have this, no migration needed
```

**Step 3**: Update mutations that set this field
```typescript
// In createTeam
await ctx.db.insert("teams", {
  // ... existing
  nameVerified: true, // We just verified it's unique
});

// In updateTeam (if needed)
await ctx.db.patch(teamId, {
  nameVerified: false, // Reset if name changed
});
```

**Best Practice**: Use `.optional()` for new fields in existing tables. Don't create migration scripts unless absolutely necessary.

---

## Performance Optimization Notes

### Database Indexes (Critical!)

Every query MUST use an index:

```typescript
// ❌ BAD - O(n) scan
const teams = await ctx.db.query("teams").filter(q => q.eq(q.field("name"), "Alpha")).first();

// ✅ GOOD - O(1) with index
const teams = await ctx.db.query("teams").withIndex("by_name", q => q.eq("name", "Alpha")).first();
```

**Existing indexes used**:
- `teams.by_name` - for unique name check
- `puzzles.by_room` - get challenges in room
- `clues.by_puzzle` - get clues for challenge
- `submissions.by_team_and_correct` - get correct submissions
- `actions.by_target_and_status` - check active attacks

**New indexes to add** (in schema.ts Phase 1):
- `challengeAttempts.by_team_and_challenge` - get active attempt
- `teams.by_lastAttackTime` - filter teams on cooldown (optional, use .filter() for now)

### Query Batching

Instead of:
```typescript
// ❌ N queries (N = number of puzzles)
const puzzles = await ctx.db.query("puzzles").collect();
const cluesMap = {};
for (const puzzle of puzzles) {
  cluesMap[puzzle._id] = await ctx.db.query("clues").withIndex("by_puzzle", q => q.eq("puzzleId", puzzle._id)).collect();
}
```

Do:
```typescript
// ✅ 1 query + parallel map
const [puzzles, allClues] = await Promise.all([
  ctx.db.query("puzzles").collect(),
  ctx.db.query("clues").collect(),
]);
const cluesMap = {};
allClues.forEach(clue => {
  if (!cluesMap[clue.puzzleId]) cluesMap[clue.puzzleId] = [];
  cluesMap[clue.puzzleId].push(clue);
});
```

---

## Concurrency Safety Patterns

### Pattern 1: Unique Constraint (Atomic Check-Insert)

```typescript
// ❌ RACE CONDITION POSSIBLE
const existing = await ctx.db.query("teams").withIndex("by_name", q => q.eq("name", name)).first();
if (existing) throw new ConvexError("Name taken");
await ctx.db.insert("teams", { name, ... }); // Between check & insert, another request might insert same name

// ✅ CONVEX HANDLES THIS
// Convex guarantees that if two mutations run simultaneously with same name,
// one will succeed and one will get the error.
// The .index() ensures the DB enforces uniqueness via transaction ordering.
```

**Key**: Convex handles serializability automatically. Just use `.withIndex()` and trust the DB.

### Pattern 2: Update with Read Dependency

```typescript
// Get current value
const team = await ctx.db.get(teamId);
const newBalance = team.pointsBalance + 100;

// Update based on current value
await ctx.db.patch(teamId, { pointsBalance: newBalance });

// ⚠️ If two mutations run simultaneously:
// - Mutation 1: reads balance=0, calculates newBalance=100, patches
// - Mutation 2: reads balance=0, calculates newBalance=100, patches (overwriting Mutation 1's change)
// Result: balance is 100 instead of 200 (one update lost)

// ✅ SOLUTION: Always query fresh before patch (Convex is fast)
// Or use server-side calculation:
```

```typescript
// Better approach - let DB calculate
// But Convex doesn't have UPDATE SET ... + syntax
// So we do:
const team = await ctx.db.get(teamId);
await ctx.db.patch(teamId, {
  pointsBalance: team.pointsBalance + 100 // Read immediately before patch
});
// Risks are minimal in practice because patches are microseconds apart
// And user-facing mutations are rarely concurrent for same team
```

**In practice**: Most operations are on different teams, so concurrency isn't an issue. For same-team concurrent ops, the later mutation's query sees the earlier patch, so it's safe.

### Pattern 3: Transaction-like Behavior

```typescript
// Multi-step operation: deduct cost, award points, log action
export const submitFlag = mutation({
  // ... 
  handler: async (ctx, args) => {
    // Step 1: Validate
    const team = await getUserTeam(ctx, args.userId);
    // ... all validation checks
    
    // Step 2: Atomic block (all succeed or all fail)
    // Convex ensures that if this mutation fails, DB is unchanged
    
    // Deduct cost
    await ctx.db.patch(team._id, { pointsBalance: team.pointsBalance - cost });
    
    // Award points
    await ctx.db.patch(team._id, { pointsBalance: team.pointsBalance + reward });
    
    // Log
    await ctx.db.insert("auditLogs", { ... });
    
    // Step 3: Return
    return { ... };
  }
});

// Convex guarantees:
// - If patch fails, subsequent patches don't run
// - If insert fails, previous patches stay (⚠️ partial state!)
// - If mutation throws, entire operation rolls back
// - No external system can see partial state
```

**Best Practice**: Keep mutations simple (< 5 steps). Complex transactions = harder to debug.

---

## Error Handling Strategy

### Convex → Frontend Error Flow

```typescript
// Backend (game.ts)
export const submitFlag = mutation({
  handler: async (ctx, args) => {
    if (!team) {
      throw new ConvexError("Team not found"); // Convex wraps this
    }
    // ... rest
  }
});

// Frontend receives:
// {
//   error: {
//     data: "Team not found"
//   }
// }

// Error handler utility
export function getErrorMessage(error, defaultMsg = "An error occurred") {
  return error?.data || error?.message || defaultMsg;
}

// Usage
try {
  await submitFlag({ ... });
} catch (error) {
  toast.error(getErrorMessage(error, "Flag submission failed"));
}
```

**Pattern**: All errors in backend are ConvexError with `.data` string. Frontend extracts with `getErrorMessage()`.

---

## Admin Configuration Points

All "magic numbers" should be admin-configurable:

| Value | Where | How to Adjust |
|-------|-------|---------------|
| Shield cost | game.ts (hardcoded 30) | Move to `perks` table or env var |
| Shield duration | game.ts (5 * 60 * 1000) | Move to schema or admin UI |
| Attack cooldown | game.ts (5 * 60 * 1000) | Move to schema or admin UI |
| Challenge investment | game.ts (50% of reward) | Move to puzzle config |
| Challenge multiplier | puzzle.challengePointsMultiplier | Admin UI (DONE in Phase 5) |
| Points per clue | clue.cost | Admin UI (existing) |

**For MVP**: Hardcode in code. For scalable system: Move to admin panel settings.

---

## Testing Strategy

### Unit Tests (Conceptual)

```javascript
// Test: Unique team names
test("Creating team with duplicate name fails", async () => {
  await createTeam({ name: "Alpha", ... });
  await expect(createTeam({ name: "Alpha", ... })).toThrow("Team name already taken");
});

// Test: Shield prevents multiple purchases
test("Cannot buy shield while active", async () => {
  await performAction({ teamId, actionType: 'defend' });
  await expect(performAction({ teamId, actionType: 'defend' })).toThrow("Shield already active");
});

// Test: Challenge attempts track time correctly
test("Challenge attempt expires after timer", async () => {
  const { timerMinutes } = await startChallengeAttempt({ challengeId });
  // Fast-forward time by timerMinutes + 1s
  // Submit flag → should fail with "Challenge time expired"
});
```

### Integration Tests (Manual)

1. **Create 2 teams**: Alpha, Beta
2. **Alpha completes 2 rooms**, Beta completes 1
3. **Verify leaderboard ranking**: Alpha > Beta (room progression first)
4. **Alpha attacks Beta**: Alpha loses 50 pts, Beta gets immunity
5. **Alpha tries to attack again**: "Cooldown active"
6. **Beta buys shield**: "Shield active: 4m 59s"
7. **Alpha tries to attack Beta**: "Target has immunity"
8. **Challenge attempt**: Start → 10 min timer → submit correct flag → 2x points

### Load Test (Many Teams)

- 50 teams
- 100 concurrent flag submissions
- 20 simultaneous attacks
- Expected: < 5 second latency, no errors, all points awarded correctly

---

## Deployment Checklist

- [ ] Schema changes deployed to Convex
- [ ] All backend functions tested locally
- [ ] Frontend build passes (npm run build)
- [ ] No console errors in browser dev tools
- [ ] Admin panel updated with new fields
- [ ] Terminology changed in UI (puzzles → challenges)
- [ ] Audit logs capture new actions
- [ ] Error messages are user-friendly
- [ ] Rate limiting prevents spam
- [ ] Multi-team testing passed
- [ ] Render env variables configured
- [ ] Database backup before deploying
- [ ] Deploy to staging first (if available)
- [ ] Verify real-time sync works
- [ ] Spot-check leaderboard calculation
- [ ] Get user feedback before final deploy

---

## Rollback Plan

If something breaks in production:

1. **Convex**: Can't delete tables, but can disable mutations temporarily
2. **Frontend**: Revert commit, redeploy
3. **Data**: Convex provides backups; request snapshot restore
4. **Communication**: Update users on status

**Prevention**: Test all changes locally before deploying. Use staging environment if possible.

