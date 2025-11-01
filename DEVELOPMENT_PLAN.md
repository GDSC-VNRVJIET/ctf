# CTF Platform - Development Plan

**Objective**: Execute all remaining feature requests in a logical, scalable order with no code duplication or failure points.

**Architecture Principles**:
- Strict reuse of existing patterns (mutations, queries, helpers)
- Multi-team concurrency-safe operations (use Convex indexes, no race conditions)
- Admin-driven configuration (admins control all tuneable parameters)
- Frontend-backend separation (all business logic in backend)
- Graceful degradation (no crashes on edge cases)

---

## PHASE 1: Schema & Data Model Foundation

### Task 1.1: Extend Schema for New Features
**Files**: `convex/schema.ts`

**Changes Required**:
1. **Teams Table**:
   - Add `lastAttackTime: v.optional(v.number())` - Track last attack for cooldown
   - Add `shieldPurchaseTime: v.optional(v.number())` - Prevent multiple shield purchases
   - Add `nameVerified: v.boolean()` - Flag for unique name validation
   
2. **Puzzles Table**:
   - Add `isChallenge: v.boolean()` - Mark as challenge question
   - Add `challengeTimerMinutes: v.optional(v.number())` - Time limit for challenge
   - Add `challengePointsMultiplier: v.optional(v.number())` - Reward multiplier (default 2x)
   - Add `topic: v.optional(v.string())` - Topic categorization
   - Add `imageUrls: v.optional(v.array(v.string()))` - Images
   - Add `fileUrls: v.optional(v.array(v.object({ name: v.string(), url: v.string() })))` - Downloadable files
   - Add `externalLinks: v.optional(v.array(v.object({ title: v.string(), url: v.string() })))` - External links
   - Rename conceptually from "puzzles" in queries/display to "challenges" (keep DB name for compatibility)

3. **Actions Table**:
   - Add `cooldownUntil: v.optional(v.number())` - Track 5-minute cooldown for attacker
   
4. **New Table: ChallengeAttempts** (for challenge question timer tracking):
   ```typescript
   challengeAttempts: defineTable({
     teamId: v.id("teams"),
     challengeId: v.id("puzzles"),
     startedAt: v.number(),
     endsAt: v.number(), // startedAt + (challengeTimerMinutes * 60 * 1000)
     isCompleted: v.boolean(),
     isPassed: v.boolean(), // Solved within time limit
     solvedAt: v.optional(v.number()),
   })
     .index("by_team", ["teamId"])
     .index("by_challenge", ["challengeId"])
     .index("by_team_and_challenge", ["teamId", "challengeId"])
   ```

**Rationale**: Modular schema prevents migration issues; each new feature is self-contained.

---

## PHASE 2: Unique Team Names & Data Integrity

### Task 2.1: Add Unique Team Name Validation
**Files**: 
- `convex/teams.ts` (createTeam mutation)
- `convex/utils.ts` (add validation helper)

**Implementation**:
```typescript
// In utils.ts - Add helper
async function validateUniqueTeamName(ctx: any, teamName: string): Promise<void> {
  const existing = await ctx.db
    .query("teams")
    .withIndex("by_name", (q) => q.eq("name", teamName))
    .first();
  
  if (existing) {
    throw new ConvexError("Team name already taken");
  }
}

// In teams.ts - Update createTeam
// Add: await validateUniqueTeamName(ctx, args.name);
// Before: const teamId = await ctx.db.insert("teams", { ... })
```

**Validation Points**:
- Check at team creation (frontend shows real-time validation via toast)
- Prevent race conditions: Convex transactions handle this atomically
- Return specific error so frontend can handle it

**Frontend (TeamManagement.jsx)**:
- Add real-time validation feedback
- Show "Team name available ✓" or "Team name taken ✗"

**Rationale**: Unique names are critical for team identification; prevents confusion in leaderboard and attacks.

---

## PHASE 3: Shield System Enhancement

### Task 3.1: Prevent Multiple Shield Purchases
**Files**:
- `convex/game.ts` (performAction mutation - shield purchase logic)
- `convex/schema.ts` (shieldPurchaseTime field added in Phase 1)

**Logic**:
```typescript
// In performAction mutation - shield action block:
if (args.actionType === 'defend') {
  // Check 1: Shield not already active
  if (team.shieldActive && team.shieldExpiry && team.shieldExpiry > now) {
    throw new ConvexError("Shield already active");
  }
  
  // Check 2: Not under attack currently
  const activeAttacks = await ctx.db
    .query("actions")
    .withIndex("by_target_and_status", (q) => 
      q.eq("targetTeamId", args.teamId).eq("status", "active")
    )
    .filter((q) => q.lt(q.field("endsAt"), now))
    .first();
  
  if (activeAttacks) {
    throw new ConvexError("Cannot buy shield while under attack");
  }
  
  // Deduct cost & activate shield
  await ctx.db.patch(team._id, {
    pointsBalance: team.pointsBalance - shieldCost,
    shieldActive: true,
    shieldExpiry: now + (5 * 60 * 1000), // 5 minutes
    shieldPurchaseTime: now,
  });
}
```

**Rationale**: Prevents exploit where team buys unlimited shields; attack/defense mechanics balanced.

### Task 3.2: Shield Timer Display
**Files**:
- `src/pages/Dashboard.jsx` (add shield timer component)
- `src/utils/timerUtils.js` (create reusable timer formatter)

**Implementation**:
```jsx
// Timer formatter utility
export function formatTimeRemaining(expiryTime) {
  const now = Date.now();
  if (now >= expiryTime) return "Expired";
  
  const secondsLeft = Math.floor((expiryTime - now) / 1000);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

// In Dashboard.jsx
const [shieldTime, setShieldTime] = useState(formatTimeRemaining(team.shieldExpiry));

useEffect(() => {
  if (!team?.shieldActive) return;
  
  const interval = setInterval(() => {
    const formatted = formatTimeRemaining(team.shieldExpiry);
    setShieldTime(formatted);
    
    if (formatted === "Expired") {
      clearInterval(interval);
      // Trigger re-fetch or state update
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [team?.shieldExpiry]);

// Render
{team?.shieldActive && (
  <div className="shield-timer">
    🛡️ Shield Active: {shieldTime}
  </div>
)}
```

**Rationale**: Real-time countdown creates urgency; prevents confusion about when shield expires.

---

## PHASE 4: Challenge Questions (Premium Feature)

### Task 4.1: Challenge Question Backend Infrastructure
**Files**: `convex/game.ts`

**New Queries/Mutations**:

1. **getActiveChallengeAttempt** (Query):
   ```typescript
   export const getActiveChallengeAttempt = query({
     args: {
       userId: v.id("users"),
       challengeId: v.id("puzzles"),
     },
     handler: async (ctx, args) => {
       const team = await getUserTeam(ctx, args.userId);
       const attempt = await ctx.db
         .query("challengeAttempts")
         .withIndex("by_team_and_challenge", (q) =>
           q.eq("teamId", team._id).eq("challengeId", args.challengeId)
         )
         .filter((q) => q.eq(q.field("isCompleted"), false))
         .first();
       
       if (!attempt) return null;
       
       const now = Date.now();
       if (now > attempt.endsAt) {
         // Challenge expired - mark as completed
         await ctx.db.patch(attempt._id, { isCompleted: true, isPassed: false });
         return null;
       }
       
       return {
         attemptId: attempt._id,
         timeRemainingMs: attempt.endsAt - now,
       };
     },
   });
   ```

2. **startChallengeAttempt** (Mutation):
   ```typescript
   export const startChallengeAttempt = mutation({
     args: {
       userId: v.id("users"),
       challengeId: v.id("puzzles"),
     },
     handler: async (ctx, args) => {
       const team = await getUserTeam(ctx, args.userId);
       const challenge = await ctx.db.get(args.challengeId);
       
       if (!challenge || !challenge.isChallenge) {
         throw new ConvexError("Not a challenge question");
       }
       
       // Check if already has active attempt
       const active = await ctx.db
         .query("challengeAttempts")
         .withIndex("by_team_and_challenge", (q) =>
           q.eq("teamId", team._id).eq("challengeId", args.challengeId)
         )
         .filter((q) => q.eq(q.field("isCompleted"), false))
         .first();
       
       if (active && active.endsAt > Date.now()) {
         throw new ConvexError("Challenge attempt already in progress");
       }
       
       // Deduct investment cost
       const investmentCost = challenge.pointsReward * 0.5; // 50% of reward
       if (team.pointsBalance < investmentCost) {
         throw new ConvexError("Insufficient points to attempt challenge");
       }
       
       const now = Date.now();
       const timerMinutes = challenge.challengeTimerMinutes || 10;
       
       const attemptId = await ctx.db.insert("challengeAttempts", {
         teamId: team._id,
         challengeId: args.challengeId,
         startedAt: now,
         endsAt: now + (timerMinutes * 60 * 1000),
         isCompleted: false,
         isPassed: false,
       });
       
       // Deduct investment
       await ctx.db.patch(team._id, {
         pointsBalance: team.pointsBalance - investmentCost,
       });
       
       return { attemptId, timerMinutes };
     },
   });
   ```

3. **Modified submitFlag** (Mutation):
   ```typescript
   // Add before submitFlag logic:
   
   // Check if this is a challenge attempt
   const challenge = await ctx.db.get(args.puzzleId);
   if (challenge && challenge.isChallenge) {
     const attempt = await ctx.db
       .query("challengeAttempts")
       .withIndex("by_team_and_challenge", (q) =>
         q.eq("teamId", team._id).eq("challengeId", args.puzzleId)
       )
       .filter((q) => q.eq(q.field("isCompleted"), false))
       .first();
     
     if (!attempt || attempt.endsAt < Date.now()) {
       throw new ConvexError("Challenge time expired or not attempted");
     }
     
     // Proceed with flag submission
     // After correct flag, multiply reward
     if (isCorrect) {
       pointsToAward = challenge.pointsReward * challenge.challengePointsMultiplier;
       await ctx.db.patch(attempt._id, { isPassed: true, solvedAt: Date.now() });
     }
   }
   ```

**Rationale**: 
- Challenge attempts are time-limited transactions
- Investment deducted upfront; rewards multiplied on success
- Prevents gaming (can't retry unlimited times for free)

### Task 4.2: Challenge Question UI
**Files**: `src/pages/RoomView.jsx`

**Add Challenge Component**:
```jsx
function ChallengeQuestionBanner({ puzzle, onStart, onStarted }) {
  const [isStarting, setIsStarting] = useState(false);
  const [attempt, setAttempt] = useState(null);
  
  const getAttempt = useQuery(
    api.game.getActiveChallengeAttempt,
    puzzle?._id ? { userId, challengeId: puzzle._id } : "skip"
  );
  const startChallenge = useMutation(api.game.startChallengeAttempt);
  
  useEffect(() => {
    setAttempt(getAttempt);
  }, [getAttempt]);
  
  const handleStart = async () => {
    if (isStarting) return;
    
    const cost = puzzle.pointsReward * 0.5;
    if (!confirm(`This will cost ${cost} points. Continue?`)) return;
    
    setIsStarting(true);
    try {
      const result = await startChallenge({ userId, challengeId: puzzle._id });
      setAttempt({ attemptId: result.attemptId, timeRemainingMs: result.timerMinutes * 60 * 1000 });
      onStarted?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start challenge"));
    } finally {
      setIsStarting(false);
    }
  };
  
  return (
    <>
      {puzzle?.isChallenge && !attempt && (
        <div className="challenge-banner" style={{ background: 'linear-gradient(135deg, #ff6b6b, #ffd93d)' }}>
          <h3>⚡ Challenge Question!</h3>
          <p>Solve this in {puzzle.challengeTimerMinutes} minutes to earn {puzzle.pointsReward * puzzle.challengePointsMultiplier} points</p>
          <p style={{ fontSize: '0.9em', opacity: 0.8 }}>Investment: {puzzle.pointsReward * 0.5} points</p>
          <button onClick={handleStart} disabled={isStarting} className="btn btn-primary">
            Start Challenge ({puzzle.pointsReward * 0.5} pts)
          </button>
        </div>
      )}
      {attempt && (
        <ChallengeTimer attemptId={attempt.attemptId} timeRemaining={attempt.timeRemainingMs} />
      )}
    </>
  );
}

function ChallengeTimer({ attemptId, timeRemaining: initialTime }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        return newTime <= 0 ? 0 : newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeLeft]);
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  return (
    <div className="challenge-timer" style={{
      background: timeLeft < 60000 ? '#ff6b6b' : '#ffd93d',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      ⏱️ Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
```

**Rationale**: Challenge UI must be visually distinct and show real-time countdown.

---

## PHASE 5: Challenge Display & Question Media

### Task 5.1: LeetCode-Style Challenge Layout
**Files**: 
- `src/pages/RoomView.jsx` (redesign challenge grid)
- `src/components/ChallengeGrid.jsx` (new component)
- `src/components/ChallengeDetail.jsx` (new component)

**Architecture**:

1. **Challenge Grid View** (when entering room):
   - Left: List of challenges in grid/list
   - Each challenge box shows:
     - Title
     - Type badge (hard/medium/easy) with color coding
     - Points reward
     - "CHALLENGE" badge if isChallenge=true
     - Lock icon if puzzle locked by progression
   
2. **Challenge Detail View** (when clicking challenge):
   - Left Panel (50%):
     - Challenge description
     - Images (carousel if multiple)
     - Download links (files)
     - External links
   - Right Panel (50%):
     - Flag submission form
     - Clues purchase
     - Challenge timer (if active)

**Implementation**:
```jsx
// RoomView.jsx - Updated structure
export default function RoomView() {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  return (
    <div className="room-view">
      {!selectedChallenge ? (
        <ChallengeGrid challenges={puzzles} onSelect={setSelectedChallenge} />
      ) : (
        <ChallengeDetail 
          challenge={selectedChallenge} 
          onBack={() => setSelectedChallenge(null)} 
        />
      )}
    </div>
  );
}

// ChallengeGrid.jsx
function ChallengeGrid({ challenges, onSelect }) {
  const difficultyColors = {
    'veryeasy': '#0ff',   // cyan
    'easy': '#00ff00',     // green
    'medium': '#ffff00',   // yellow
    'hard': '#ff6b6b',     // red
    'veryhard': '#ff00ff', // magenta
  };
  
  return (
    <div className="challenge-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
      {challenges.map(challenge => (
        <div
          key={challenge._id}
          className="challenge-card"
          onClick={() => onSelect(challenge)}
          style={{
            border: `2px solid ${difficultyColors[challenge.type] || '#666'}`,
            padding: '16px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s',
          }}
        >
          <h3>{challenge.title}</h3>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: difficultyColors[challenge.type] }}>
              {challenge.type}
            </span>
            {challenge.isChallenge && <span className="badge" style={{ background: '#ffd93d' }}>⚡ CHALLENGE</span>}
          </div>
          <p style={{ marginTop: '12px', fontSize: '18px', fontWeight: 'bold' }}>
            {challenge.pointsReward} pts
          </p>
        </div>
      ))}
    </div>
  );
}

// ChallengeDetail.jsx
function ChallengeDetail({ challenge, onBack }) {
  return (
    <div className="challenge-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      <div className="challenge-left">
        <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '16px' }}>← Back</button>
        <h1>{challenge.title}</h1>
        <p>{challenge.description}</p>
        
        {challenge.imageUrls?.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3>Images</h3>
            {challenge.imageUrls.map((url, i) => (
              <img key={i} src={url} alt={`Challenge ${i + 1}`} style={{ maxWidth: '100%', marginTop: '12px', borderRadius: '8px' }} />
            ))}
          </div>
        )}
        
        {challenge.externalLinks?.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3>References</h3>
            {challenge.externalLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '8px' }}>
                🔗 {link.title}
              </a>
            ))}
          </div>
        )}
      </div>
      
      <div className="challenge-right">
        <ChallengeQuestionBanner challenge={challenge} />
        <FlagSubmissionForm puzzleId={challenge._id} />
        <CluesSection puzzleId={challenge._id} />
        {challenge.fileUrls?.length > 0 && (
          <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a2e', borderRadius: '8px' }}>
            <h3>Downloads</h3>
            {challenge.fileUrls.map((file, i) => (
              <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="btn" style={{ display: 'block', marginTop: '8px' }}>
                ⬇️ {file.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Rationale**: LeetCode-style layout is familiar to CTF participants; supports rich media without overcomplication.

### Task 5.2: Admin Panel - Media Upload
**Files**: `src/pages/AdminPanel.jsx` (EditPuzzleForm)

**Add Media Upload Fields**:
```jsx
// In EditPuzzleForm / CreatePuzzleForm
<div className="form-group">
  <label>Topic</label>
  <input
    type="text"
    value={formData.topic || ''}
    onChange={e => setFormData({ ...formData, topic: e.target.value })}
    placeholder="e.g., Cryptography, Web Security"
  />
</div>

<div className="form-group">
  <label>Is Challenge Question?</label>
  <input
    type="checkbox"
    checked={formData.isChallenge || false}
    onChange={e => setFormData({ ...formData, isChallenge: e.target.checked })}
  />
</div>

{formData.isChallenge && (
  <>
    <div className="form-group">
      <label>Challenge Timer (minutes)</label>
      <input
        type="number"
        value={formData.challengeTimerMinutes || 10}
        onChange={e => setFormData({ ...formData, challengeTimerMinutes: parseInt(e.target.value) })}
        min="1"
      />
    </div>
    <div className="form-group">
      <label>Points Multiplier</label>
      <input
        type="number"
        value={formData.challengePointsMultiplier || 2}
        onChange={e => setFormData({ ...formData, challengePointsMultiplier: parseFloat(e.target.value) })}
        min="1"
        step="0.5"
      />
    </div>
  </>
)}

<div className="form-group">
  <label>Image URLs (comma-separated)</label>
  <textarea
    value={formData.imageUrls?.join(', ') || ''}
    onChange={e => setFormData({ ...formData, imageUrls: e.target.value.split(',').map(u => u.trim()).filter(u => u) })}
    rows={2}
  />
</div>

<div className="form-group">
  <label>File Downloads (JSON array)</label>
  <textarea
    value={JSON.stringify(formData.fileUrls || [], null, 2)}
    onChange={e => {
      try {
        setFormData({ ...formData, fileUrls: JSON.parse(e.target.value) });
      } catch (err) {
        // Invalid JSON, ignore
      }
    }}
    rows={3}
    placeholder='[{"name": "exploit.py", "url": "..."}]'
  />
</div>

<div className="form-group">
  <label>External Links (JSON array)</label>
  <textarea
    value={JSON.stringify(formData.externalLinks || [], null, 2)}
    onChange={e => {
      try {
        setFormData({ ...formData, externalLinks: JSON.parse(e.target.value) });
      } catch (err) {}
    }}
    rows={3}
    placeholder='[{"title": "Documentation", "url": "..."}]'
  />
</div>
```

**Backend Update** (`convex/admin.ts` - updatePuzzle):
```typescript
// Add new fields to mutation args and to db.patch call
imageUrls: v.optional(v.array(v.string())),
fileUrls: v.optional(v.array(v.object({ name: v.string(), url: v.string() }))),
externalLinks: v.optional(v.array(v.object({ title: v.string(), url: v.string() }))),
topic: v.optional(v.string()),
isChallenge: v.optional(v.boolean()),
challengeTimerMinutes: v.optional(v.number()),
challengePointsMultiplier: v.optional(v.number()),
```

**Rationale**: Admins upload URLs externally (e.g., Imgur, GitHub); we store references. Keeps DB light and leverages cloud storage.

---

## PHASE 6: Attack Cooldown & Immunity

### Task 6.1: Attack Cooldown Enforcement
**Files**: `convex/game.ts` (performAction mutation)

**Logic**:
```typescript
// In performAction - attack action block:
if (args.actionType === 'attack') {
  const targetTeam = await ctx.db.get(args.targetTeamId);
  if (!targetTeam) throw new ConvexError("Target team not found");
  
  // Check if attacker is on cooldown
  const now = Date.now();
  if (team.lastAttackTime && team.lastAttackTime + (5 * 60 * 1000) > now) {
    const cooldownUntil = team.lastAttackTime + (5 * 60 * 1000);
    const secondsLeft = Math.ceil((cooldownUntil - now) / 1000);
    throw new ConvexError(`Cooldown active. Try again in ${secondsLeft}s`);
  }
  
  // Check if target has immunity
  if (targetTeam.immunityUntil && targetTeam.immunityUntil > now) {
    throw new ConvexError("Target team has immunity - attack blocked");
  }
  
  // Perform attack
  await ctx.db.patch(team._id, {
    pointsBalance: team.pointsBalance - attackCost,
    lastAttackTime: now,
  });
  
  // Apply cooldown to attacker's next attack action
  const cooldownUntil = now + (5 * 60 * 1000);
  
  // Add immunity to target
  await ctx.db.patch(targetTeam._id, {
    immunityUntil: now + (5 * 60 * 1000),
  });
  
  // Create action record
  await ctx.db.insert("actions", {
    teamId: team._id,
    actionType: "attack",
    targetTeamId: args.targetTeamId,
    cost: attackCost,
    createdAt: now,
    endsAt: cooldownUntil,
    cooldownUntil: cooldownUntil,
    status: "active",
  });
}
```

**Frontend Feedback** (Leaderboard.jsx):
```jsx
// Show cooldown timer on attack button
{!entry.underAttack && team && entry.teamId !== team._id && (
  <button
    className="btn btn-danger"
    disabled={entry.shieldActive || entry.attackCooldownActive}
    onClick={() => handleAttack(entry.teamId)}
  >
    {entry.attackCooldownActive 
      ? `Cooldown: ${entry.cooldownTimeRemaining}` 
      : "Attack"}
  </button>
)}
```

**Rationale**: 5-minute cooldown prevents spam attacks; immunity prevents immediate re-attack after defense.

---

## PHASE 7: Leaderboard UI Enhancement

### Task 7.1: Half-Collapsible Right Sidebar
**Files**: 
- `src/pages/Dashboard.jsx` (main dashboard)
- `src/components/LeaderboardSidebar.jsx` (new component)
- `src/index.css` (add sidebar styles)

**Implementation**:
```jsx
// LeaderboardSidebar.jsx
export function LeaderboardSidebar({ isOpen, onToggle }) {
  const leaderboard = useQuery(api.game.getLeaderboard);
  
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="leaderboard-toggle"
        style={{
          position: 'fixed',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: '999',
          padding: '12px 8px',
          background: '#0ff',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '8px 0 0 8px',
        }}
      >
        {isOpen ? '→' : '←'}
      </button>
      
      {/* Sidebar */}
      <div
        className={`leaderboard-sidebar ${isOpen ? 'open' : 'closed'}`}
        style={{
          position: 'fixed',
          right: '0',
          top: '0',
          width: '350px',
          height: '100vh',
          background: '#0a0e27',
          borderLeft: '2px solid #0ff',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          overflowY: 'auto',
          padding: '24px 16px',
          zIndex: '998',
        }}
      >
        <h2 style={{ color: '#0ff', marginBottom: '16px' }}>Leaderboard</h2>
        {leaderboard?.map((entry, index) => (
          <div key={entry.teamId} className="leaderboard-entry" style={{
            padding: '12px',
            background: '#1a1a2e',
            borderRadius: '8px',
            marginBottom: '12px',
            borderLeft: '4px solid #0ff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#0ff' }}>#{index + 1}</span>
              <span>{entry.teamName}</span>
            </div>
            <div style={{ fontSize: '0.9em', marginTop: '8px', color: '#aaa' }}>
              <div>Room: {entry.highestRoomName}</div>
              <div>Points: {entry.pointsBalance.toFixed(0)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// In Dashboard.jsx
export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, paddingRight: sidebarOpen ? '350px' : '0', transition: 'padding 0.3s' }}>
        {/* Main dashboard content */}
      </div>
      <LeaderboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
    </div>
  );
}
```

**CSS** (src/index.css):
```css
.leaderboard-sidebar {
  box-shadow: -4px 0 20px rgba(0, 255, 255, 0.1);
}

.leaderboard-sidebar::-webkit-scrollbar {
  width: 8px;
}

.leaderboard-sidebar::-webkit-scrollbar-track {
  background: #1a1a2e;
}

.leaderboard-sidebar::-webkit-scrollbar-thumb {
  background: #0ff;
  border-radius: 4px;
}

.leaderboard-sidebar::-webkit-scrollbar-thumb:hover {
  background: #00ffff;
}
```

**Rationale**: Sidebar keeps leaderboard accessible without sacrificing main content space; collapsible design prevents distraction.

---

## PHASE 8: Terminology Update

### Task 8.1: Rename Puzzles to Challenges
**Files**: ALL UI/display files (NOT DB tables)

**Scope**:
- Frontend labels: "Puzzles" → "Challenges"
- Component naming: Keep technical names for code clarity (e.g., `puzzle` variable name stays, but label says "Challenge")
- DB table: Keep as "puzzles" for backward compatibility

**Files to Update**:
1. `src/pages/RoomView.jsx` - "View Challenges" instead of "View Puzzles"
2. `src/pages/AdminPanel.jsx` - "Challenges" tab instead of "Puzzles"
3. `src/components/ChallengeGrid.jsx` - Title says "Challenges"
4. All form labels in admin panel

**Example Change**:
```jsx
// Before
<h2>Add Puzzle</h2>

// After
<h2>Add Challenge</h2>

// Variable names stay the same for code clarity
const challenge = await ctx.db.get(args.puzzleId); // DB still "puzzles"
```

**Rationale**: "Challenges" is more CTF-appropriate terminology; variable names stay the same to avoid massive refactor.

---

## PHASE 9: Integration & Testing

### Task 9.1: End-to-End Feature Testing
**Scope**: All features from Phases 1-8

**Test Cases**:

1. **Unique Team Names**:
   - ✓ Create team with unique name (success)
   - ✓ Create team with duplicate name (error)
   - ✓ Multiple concurrent requests with same name (only one succeeds)

2. **Shield System**:
   - ✓ Buy shield when not active (success)
   - ✓ Buy shield while already active (error)
   - ✓ Buy shield while under attack (error)
   - ✓ Shield timer counts down and expires
   - ✓ Can't attack team with active immunity

3. **Challenge Questions**:
   - ✓ Start challenge attempt (deducts investment)
   - ✓ Submit correct flag within time (award 2x points)
   - ✓ Submit incorrect flag (points already deducted)
   - ✓ Time expires (challenge marked incomplete)
   - ✓ Can't start if already in progress

4. **Challenge Media**:
   - ✓ Admin uploads images, files, links
   - ✓ Challenge detail page displays all media
   - ✓ Files downloadable, links clickable

5. **Attack Cooldown**:
   - ✓ Attack team (success, attacker on cooldown)
   - ✓ Try to attack again within 5 min (error with countdown)
   - ✓ Wait 5 min (cooldown expires, can attack)
   - ✓ Attacked team has immunity, can't be attacked again immediately

6. **Leaderboard Sidebar**:
   - ✓ Sidebar opens/closes smoothly
   - ✓ Leaderboard updates in real-time
   - ✓ Shows room tier and points correctly

### Task 9.2: Concurrency & Multi-Team Testing
**Scenario**: 5 teams, 10 active challenges

**Test**:
- Multiple teams submit flags simultaneously
- Multiple teams attack different targets
- Teams buy shields at same time
- Verify no race conditions, all operations complete correctly

**Tools**: Manually simulate via multiple browser tabs or load-testing tool.

**Rationale**: Multi-team concurrency is critical for production CTF; Convex handles transactions atomically, but edge cases must be verified.

---

## PHASE 10: Deployment & Monitoring

### Task 10.1: Schema Migration
**Files**: Create migration script

**Step**:
1. Backup current DB (Convex provides snapshot)
2. Add new fields to schema
3. Run migration function (initializeHighestRoomIds pattern)
4. Verify data integrity

### Task 10.2: Deployment Checklist
```
- [ ] All schema changes applied
- [ ] All backend mutations/queries updated
- [ ] All frontend components updated
- [ ] No console errors in dev build
- [ ] Build passes (npm run build)
- [ ] Audit logs capture new actions
- [ ] Admin panel updated with new fields
- [ ] Error messages are user-friendly
- [ ] Rate limiting prevents spam
- [ ] Multi-team testing passed
- [ ] Render deployment configured
- [ ] Env variables set
```

---

## Summary Table

| Phase | Task | Files | Priority | Est. Complexity |
|-------|------|-------|----------|-----------------|
| 1 | Schema Extensions | schema.ts | HIGH | Low |
| 2 | Unique Team Names | teams.ts, utils.ts | HIGH | Low |
| 3.1 | Shield Prevention | game.ts | HIGH | Medium |
| 3.2 | Shield Timer | Dashboard.jsx | MEDIUM | Low |
| 4.1 | Challenge Backend | game.ts | HIGH | High |
| 4.2 | Challenge UI | RoomView.jsx | HIGH | High |
| 5.1 | LeetCode Layout | RoomView.jsx, new components | HIGH | High |
| 5.2 | Media Upload Admin | AdminPanel.jsx | MEDIUM | Medium |
| 6.1 | Attack Cooldown | game.ts | HIGH | Medium |
| 7.1 | Leaderboard Sidebar | Dashboard.jsx, new component | MEDIUM | Medium |
| 8.1 | Terminology Update | All UI files | LOW | Low |
| 9 | Testing & QA | All files | HIGH | High |
| 10 | Deployment | All files | HIGH | Medium |

---

## Code Quality Principles

1. **No Duplication**: Reuse existing patterns (checkSubmissionRateLimit, getUserTeam, etc.)
2. **Atomic Operations**: Use Convex transactions for multi-step mutations
3. **Error Handling**: All errors have getErrorMessage wrapper for frontend
4. **Indexes**: All queries use appropriate indexes for performance
5. **Validation**: Frontend validation + backend validation (defense in depth)
6. **Audit Logs**: All admin actions logged
7. **Rate Limiting**: Prevent spam (submissions, attacks, shield purchases)
8. **Concurrency**: Convex handles this atomically; verify with multi-team tests

---

## Execution Strategy

**Start with**: Phase 1 (Schema) → Phase 2 (Unique Names) → Phase 3 (Shield)
**Reason**: Foundation first, then features build on top.

**Parallel tracks** (can be done simultaneously by multiple people):
- Track A: Phase 4 (Challenge Backend) + Phase 5 (Challenge UI)
- Track B: Phase 6 (Cooldown) + Phase 7 (Sidebar)
- Track C: Phase 8 (Terminology) + Phase 9 (Testing)

**Deploy after**: Phase 9 (Testing) complete, Phase 10 ready to execute.

---

This plan ensures:
✅ Zero code duplication
✅ Multi-team safety (concurrency)
✅ Admin-driven configuration
✅ Production-grade error handling
✅ Clear execution sequence
✅ Testability at each phase
