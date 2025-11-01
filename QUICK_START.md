# CTF Platform - Development Quick Start

## Current Architecture
- **Frontend**: React 18 + Convex + React Router
- **Backend**: Convex TypeScript (real-time DB with queries/mutations)
- **Auth**: Email-based with verification
- **Game Flow**: Rooms (progression) → Challenges (puzzles) → Points → Leaderboard

---

## Feature Requests (Prioritized by Dependencies)

### 🔴 PHASE 1: Data Model (Must do first)
**Schema Extensions**:
- Add to `teams`: `lastAttackTime`, `shieldPurchaseTime`, `nameVerified`
- Add to `puzzles`: `isChallenge`, `challengeTimerMinutes`, `challengePointsMultiplier`, `topic`, `imageUrls[]`, `fileUrls[]`, `externalLinks[]`
- Add to `actions`: `cooldownUntil`
- **NEW TABLE**: `challengeAttempts` (tracks active challenge attempts with timers)

**Why first**: All other features depend on schema fields existing.

---

### 🟡 PHASE 2: Unique Team Names & Core Safety
**Requirement**: No two teams can have same name.

**Implementation**:
- Add unique constraint check in `teams.ts` → `createTeam` mutation
- Use existing `.index("by_name", ["name"])` to check
- Return clear error: "Team name already taken"
- **Frontend**: Real-time validation feedback with toast messages

**Multi-team safety**: Convex transactions handle this atomically; no race condition.

---

### 🟡 PHASE 3: Enhanced Shield System
**Requirements**:
1. Can't buy shield twice (already active)
2. Can't buy shield while under attack
3. Shield lasts exactly 5 minutes with live countdown timer

**Implementation**:
- `performAction` mutation → add validation checks before shield purchase
- Deduct cost, set `shieldActive=true`, `shieldExpiry=now+5min`
- **Frontend**: `Dashboard.jsx` shows "🛡️ Shield: 4m 23s" with live countdown
- Use utility: `formatTimeRemaining()` for countdown display

**Why split from Attack Cooldown**: Shield is defensive; cooldown is offensive penalty.

---

### 🔴 PHASE 4: Challenge Questions (Premium Feature)
**Requirements**:
- Admin marks puzzle as `isChallenge=true`
- Admin sets `challengeTimerMinutes` (e.g., 10) and `pointsMultiplier` (e.g., 2x)
- Team spends 50% of puzzle points to START challenge
- Timer starts, team has X minutes to solve
- If solved within time: Award 2x points + "CHALLENGE SOLVED ✓" badge
- If time expires: Challenge marked complete, 50% investment lost

**Key Design**:
- `challengeAttempts` table tracks active attempts
- Before flag submission: Check if challenge attempt is active & time not expired
- Investment deducted upfront (when starting), not on solve
- Prevents infinite retry exploit

**Backend Logic** (game.ts):
1. `startChallengeAttempt(userId, challengeId)` → Create attempt, deduct cost
2. `submitFlag()` → Check if active challenge attempt, multiply reward if correct
3. `getActiveChallengeAttempt(userId, challengeId)` → Query for timer display

---

### 🟡 PHASE 5: Challenge Media & LeetCode-Style Display
**Requirements**:
- Challenge grid shows all puzzles in room with difficulty badges
- Click challenge → opens detail view
- Left panel: description, images, download files, links
- Right panel: timer (if challenge), flag form, clues

**Admin Setup**:
- Upload URLs (external hosting: Imgur, GitHub, etc.)
- Store as arrays: `imageUrls`, `fileUrls`, `externalLinks`
- Add `topic` field for categorization

**Frontend**:
- New components: `ChallengeGrid.jsx`, `ChallengeDetail.jsx`
- Color-coded difficulty: cyan (veryeasy) → red (veryhard)
- Media carousel/thumbnails

**DB compatibility**: DB column still called "puzzles" for backward compatibility; UI calls them "challenges".

---

### 🔴 PHASE 6: Attack Cooldown & Immunity
**Requirements**:
1. After attacking, attacker must wait 5 minutes before next attack
2. Attacked team gets 5 minutes of immunity (can't be attacked again immediately)
3. Show cooldown timer on leaderboard ("Cooldown: 3m 45s")

**Implementation** (game.ts):
- `performAction(attack)` → Check `team.lastAttackTime + 5min > now`
- Set `lastAttackTime = now` for attacker
- Set `targetTeam.immunityUntil = now + 5min` for target
- Create audit log for admin review

**Frontend**:
- Leaderboard shows attack button as disabled with countdown
- "Attack" → "Cooldown: 4m 12s"

---

### 🟡 PHASE 7: Leaderboard UI - Half-Collapsible Sidebar
**Requirements**:
- Right sidebar (width: 350px)
- Toggle button on right edge (← / →)
- Smooth slide-in/out animation
- Shows real-time leaderboard
- Grouped by room tier, sorted by points within tier

**Frontend**:
- New component: `LeaderboardSidebar.jsx`
- Add to `Dashboard.jsx`
- CSS: Fixed positioning, z-index management, smooth transitions
- Shows: #1 Team Name, Room, Points

---

### 🟢 PHASE 8: Terminology Update
**Change**: "Puzzles" → "Challenges" in UI only

**Scope** (NO backend changes):
- AdminPanel tabs: "Puzzles" → "Challenges"
- RoomView labels: "View Puzzles" → "View Challenges"
- Forms: "Add Puzzle" → "Add Challenge"
- Variables stay the same (no refactor needed)

**Example**:
```javascript
// Before
const puzzle = await ctx.db.get(args.puzzleId);

// After - variable name SAME, display label CHANGED
const challenge = await ctx.db.get(args.puzzleId); // Still "puzzles" in DB
// Renders as: "Challenge Details" in UI
```

---

## Execution Order (NO PARALLELIZATION UNTIL Phase 3 DONE)

1. **Phase 1**: Schema update → Convex redeploy → Verify no errors
2. **Phase 2**: Unique team names → Test with duplicate teams
3. **Phase 3**: Shield system → Test shield + attack interactions
4. **THEN Split into parallel tracks**:
   - **Track A**: Phase 4 (Challenge Backend) + Phase 5 (Challenge UI)
   - **Track B**: Phase 6 (Cooldown) + Phase 7 (Sidebar)
   - **Track C**: Phase 8 (Terminology) - can overlap

5. **Final**: Phase 9 (Testing) → Phase 10 (Deploy)

---

## Multi-Team Concurrency Checklist

✅ **Atomic operations**: Convex transactions prevent race conditions
✅ **Indexes**: All queries use `.index()` for performance at scale
✅ **Rate limiting**: Submission cooldown prevents flag spam
✅ **Unique constraints**: Team names unique via index check
✅ **Audit logs**: All admin actions logged for review

**Testing scenario**: 50 teams, each with 5 members, 10 active challenges, 20 concurrent flag submissions.
- Expected: No errors, all operations complete successfully
- Method: Run locally with Convex dev server, manually test via browser tabs

---

## Common Pitfalls to Avoid

1. ❌ **Renaming DB tables**: Don't. Keep "puzzles" table, change UI labels only.
2. ❌ **Duplicate validation logic**: Use `validateUniqueTeamName()` helper everywhere.
3. ❌ **Missing error messages**: All mutations must have user-friendly error strings.
4. ❌ **Race conditions**: Always use Convex indexes and atomic transactions.
5. ❌ **Hardcoded values**: All timer durations, costs, multipliers should be configurable by admin or in schema.

---

## File Structure Reference

```
convex/
  ├─ schema.ts .................. Data model (MODIFY: Phase 1)
  ├─ game.ts .................... Game logic (MODIFY: Phases 4, 6)
  ├─ teams.ts ................... Team management (MODIFY: Phase 2)
  ├─ admin.ts ................... Admin features (MODIFY: Phase 5)
  └─ utils.ts ................... Helpers (MODIFY: Phase 2)

src/pages/
  ├─ Dashboard.jsx .............. Main dashboard (MODIFY: Phases 3, 7, 8)
  ├─ RoomView.jsx ............... Challenge display (MODIFY: Phases 5, 8)
  ├─ AdminPanel.jsx ............. Admin panel (MODIFY: Phases 5, 8)
  └─ Leaderboard.jsx ............ Leaderboard (MODIFY: Phase 7)

src/components/
  ├─ ChallengeGrid.jsx .......... NEW - Phase 5
  ├─ ChallengeDetail.jsx ........ NEW - Phase 5
  ├─ LeaderboardSidebar.jsx ..... NEW - Phase 7
  └─ ... (existing)
```

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run Convex dev
npx convex dev

# View Convex dashboard
convex dashboard

# Deploy to Render
git push origin main (auto-deploys if configured)
```

---

## Key Dependencies Between Features

```
Phase 1 (Schema)
    ↓
Phase 2 (Unique Names) → Phase 3 (Shield)
    ↓
Phase 4 (Challenge Backend) ← Phase 5 (Media)
    ↓
Phase 6 (Cooldown) → Phase 7 (Sidebar)
    ↓
Phase 8 (Terminology) → Phase 9 (Testing) → Phase 10 (Deploy)
```

**Critical Path**: Phase 1 → 2 → 3 (MUST DO IN ORDER)
**Can overlap**: 4 & 5, 6 & 7, all with 8

---

## Success Criteria

✅ No duplicate team names across system
✅ Shield prevents multiple purchases & works during attacks
✅ Challenge questions work with timers & point multipliers
✅ LeetCode-style display shows images, files, links
✅ Attack cooldown enforced, immunity blocks re-attacks
✅ Leaderboard sidebar accessible without obstruction
✅ All terminology updated (UI only)
✅ Multi-team concurrency tested & verified
✅ Production deployment successful
✅ Zero crashes, all errors have user-friendly messages

---

## Questions During Development?

- **Schema syntax**: Check existing tables as examples
- **Mutation patterns**: Look at `performAction` in game.ts
- **Query indexing**: Follow `withIndex()` pattern in admin.ts
- **Frontend hooks**: Use `useQuery`, `useMutation` from convex/react
- **Error handling**: Use `getErrorMessage(error)` utility

