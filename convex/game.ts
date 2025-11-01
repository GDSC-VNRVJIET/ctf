import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Helper to hash flags
async function hashFlag(flag: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(flag + "SECRET_SALT_FOR_FLAGS");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Helper to validate flag format
function validateFlagFormat(flag: string): boolean {
  if (!flag || flag.length > 500) return false;
  const pattern = /^[A-Za-z0-9_\-{}\[\]@:.]+$/;
  if (/['\";<>&|]/.test(flag)) return false;
  return pattern.test(flag);
}

// Helper to check submission rate limit
async function checkSubmissionRateLimit(
  ctx: any,
  teamId: string,
  puzzleId: string,
  limit: number = 10,
  windowMinutes: number = 5
) {
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  const recentSubmissions = await ctx.db
    .query("submissions")
    .withIndex("by_team_and_puzzle", (q: any) => 
      q.eq("teamId", teamId).eq("puzzleId", puzzleId)
    )
    .filter((q: any) => q.gte(q.field("submissionTime"), cutoff))
    .collect();

  if (recentSubmissions.length >= limit) {
    throw new ConvexError("Too many flag submissions. Please wait before trying again.");
  }
}

// Helper to get user's team
async function getUserTeam(ctx: any, userId: string) {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!membership) {
    throw new ConvexError("Not in any team");
  }

  const team = await ctx.db.get(membership.teamId);
  if (!team) {
    throw new ConvexError("Team not found");
  }

  return team;
}

// Helper to check if user is captain
async function isCaptain(ctx: any, userId: string, teamId: string): Promise<boolean> {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q: any) => 
      q.eq("teamId", teamId).eq("userId", userId)
    )
    .first();

  return membership && membership.role === "captain";
}

// Queries
export const getRooms = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return rooms.sort((a, b) => a.orderIndex - b.orderIndex);
  },
});

export const getRoom = query({
  args: { userId: v.id("users"), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const team = await getUserTeam(ctx, args.userId);
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new ConvexError("Room not found");
    }

    // Check if team has unlocked this room
    if (team.currentRoomId) {
      const currentRoom = await ctx.db.get(team.currentRoomId);
      if (currentRoom && "orderIndex" in currentRoom && room.orderIndex > currentRoom.orderIndex) {
        throw new ConvexError("Room not unlocked yet");
      }
    } else {
      if (room.orderIndex > 1) {
        throw new ConvexError("Room not unlocked yet");
      }
    }

    // Get puzzles for this room
    const puzzles = await ctx.db
      .query("puzzles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get clues for each puzzle
    const puzzlesWithClues = await Promise.all(
      puzzles.map(async (puzzle) => {
        const clues = await ctx.db
          .query("clues")
          .withIndex("by_puzzle", (q) => q.eq("puzzleId", puzzle._id))
          .collect();
        return { ...puzzle, clues: clues.sort((a, b) => a.orderIndex - b.orderIndex) };
      })
    );

    return { ...room, puzzles: puzzlesWithClues };
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx, args) => {
    const teams = await ctx.db.query("teams").collect();
    const now = Date.now();

    const leaderboard = await Promise.all(
      teams.map(async (team) => {
        // Count solved puzzles
        const solvedPuzzles = await ctx.db
          .query("submissions")
          .withIndex("by_team_and_correct", (q) => 
            q.eq("teamId", team._id).eq("isCorrect", true)
          )
          .collect();

        let roomIndex = 0;
        if (team.currentRoomId) {
          const room = await ctx.db.get(team.currentRoomId);
          if (room) roomIndex = room.orderIndex;
        }

        // Check if under attack
        const activeAttacks = await ctx.db
          .query("actions")
          .withIndex("by_target_and_status", (q) => 
            q.eq("targetTeamId", team._id).eq("status", "active")
          )
          .filter((q) => 
            q.and(
              q.eq(q.field("actionType"), "attack"),
              q.gt(q.field("endsAt"), now)
            )
          )
          .first();

        const score = team.pointsBalance + (solvedPuzzles.length * 100) + (roomIndex * 500);

        return {
          teamId: team._id,
          teamName: team.name,
          score,
          roomIndex,
          pointsBalance: team.pointsBalance,
          shieldActive: team.shieldActive && team.shieldExpiry && team.shieldExpiry > now,
          underAttack: !!activeAttacks,
        };
      })
    );

    return leaderboard.sort((a, b) => b.pointsBalance - a.pointsBalance);
  },
});

export const getPerks = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("perks").collect();
  },
});

// Mutations
export const submitFlag = mutation({
  args: {
    userId: v.id("users"),
    puzzleId: v.id("puzzles"),
    flag: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const team = await getUserTeam(ctx, args.userId);

    // Rate limiting
    await checkSubmissionRateLimit(ctx, team._id, args.puzzleId);

    // Check if under attack
    const now = Date.now();
    const activeAttacks = await ctx.db
      .query("actions")
      .withIndex("by_target_and_status", (q) => 
        q.eq("targetTeamId", team._id).eq("status", "active")
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("actionType"), "attack"),
          q.gt(q.field("endsAt"), now)
        )
      )
      .first();

    if (activeAttacks) {
      await ctx.db.insert("auditLogs", {
        userId: args.userId,
        action: "blocked_submission_under_attack",
        detailsJson: JSON.stringify({
          teamId: team._id,
          puzzleId: args.puzzleId,
          attackId: activeAttacks._id,
        }),
        createdAt: Date.now(),
      });
      throw new ConvexError("Team is under attack. Cannot submit flags.");
    }

    // Get puzzle
    const puzzle = await ctx.db.get(args.puzzleId);
    if (!puzzle || !puzzle.isActive) {
      throw new ConvexError("Puzzle not found or inactive");
    }

    // Check if team has unlocked this puzzle's room
    const room = await ctx.db.get(puzzle.roomId);
    if (!room) {
      throw new ConvexError("Room not found");
    }

    if (team.currentRoomId) {
      const currentRoom = await ctx.db.get(team.currentRoomId);
      if (currentRoom && "orderIndex" in currentRoom && room.orderIndex > currentRoom.orderIndex) {
        throw new ConvexError("Room not unlocked yet");
      }
    } else if (room.orderIndex > 1) {
      throw new ConvexError("Room not unlocked yet");
    }

    // Validate flag format
    if (!validateFlagFormat(args.flag)) {
      await ctx.db.insert("auditLogs", {
        userId: args.userId,
        action: "submit_flag_invalid_format",
        detailsJson: JSON.stringify({
          teamId: team._id,
          puzzleId: args.puzzleId,
        }),
        createdAt: Date.now(),
      });
      throw new ConvexError("Invalid flag format");
    }

    // Check if already solved
    const existingCorrect = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_puzzle", (q) => 
        q.eq("teamId", team._id).eq("puzzleId", args.puzzleId)
      )
      .filter((q) => q.eq(q.field("isCorrect"), true))
      .first();

    if (existingCorrect) {
      throw new ConvexError("Puzzle already solved");
    }

    // Validate flag
    const submittedHash = await hashFlag(args.flag);
    const isCorrect = submittedHash === puzzle.flagHash;

    // Record submission
    await ctx.db.insert("submissions", {
      teamId: team._id,
      puzzleId: args.puzzleId,
      submittedFlag: submittedHash,
      isCorrect,
      submissionTime: Date.now(),
      ipAddress: args.ipAddress,
    });

    if (isCorrect) {
      // Award points
      await ctx.db.patch(team._id, {
        pointsBalance: team.pointsBalance + puzzle.pointsReward,
      });

      // Log
      await ctx.db.insert("auditLogs", {
        userId: args.userId,
        action: "solve_puzzle",
        detailsJson: JSON.stringify({
          teamId: team._id,
          teamName: team.name,
          puzzleId: args.puzzleId,
          puzzleTitle: puzzle.title,
          points: puzzle.pointsReward,
        }),
        createdAt: Date.now(),
      });

      return { message: "Correct flag!", pointsAwarded: puzzle.pointsReward };
    } else {
      await ctx.db.insert("auditLogs", {
        userId: args.userId,
        action: "failed_flag_submission",
        detailsJson: JSON.stringify({
          teamId: team._id,
          puzzleId: args.puzzleId,
        }),
        createdAt: Date.now(),
      });

      return { message: "Incorrect flag", pointsAwarded: 0 };
    }
  },
});

export const buyClue = mutation({
  args: {
    userId: v.id("users"),
    clueId: v.id("clues"),
  },
  handler: async (ctx, args) => {
    const team = await getUserTeam(ctx, args.userId);

    if (!(await isCaptain(ctx, args.userId, team._id))) {
      throw new ConvexError("Only captain can purchase clues");
    }

    const clue = await ctx.db.get(args.clueId);
    if (!clue) {
      throw new ConvexError("Clue not found");
    }

    // Check if already purchased
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_team_and_clue", (q) => 
        q.eq("teamId", team._id).eq("clueId", args.clueId)
      )
      .first();

    if (existing) {
      throw new ConvexError("Clue already purchased");
    }

    // Check balance
    if (team.pointsBalance < clue.cost) {
      throw new ConvexError("Insufficient points");
    }

    // Purchase
    await ctx.db.patch(team._id, {
      pointsBalance: team.pointsBalance - clue.cost,
    });

    await ctx.db.insert("purchases", {
      teamId: team._id,
      clueId: args.clueId,
      purchasedAt: Date.now(),
    });

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "buy_clue",
      detailsJson: JSON.stringify({
        teamId: team._id,
        clueId: args.clueId,
        cost: clue.cost,
      }),
      createdAt: Date.now(),
    });

    return { message: "Clue purchased", clueText: clue.text };
  },
});

export const buyPerk = mutation({
  args: {
    userId: v.id("users"),
    perkId: v.id("perks"),
  },
  handler: async (ctx, args) => {
    const team = await getUserTeam(ctx, args.userId);

    if (!(await isCaptain(ctx, args.userId, team._id))) {
      throw new ConvexError("Only captain can purchase perks");
    }

    const perk = await ctx.db.get(args.perkId);
    if (!perk) {
      throw new ConvexError("Perk not found");
    }

    // Check if one-time and already purchased
    if (perk.isOneTime) {
      const existing = await ctx.db
        .query("purchases")
        .withIndex("by_team_and_perk", (q) => 
          q.eq("teamId", team._id).eq("perkId", args.perkId)
        )
        .first();

      if (existing) {
        throw new ConvexError("Perk already purchased");
      }
    }

    // Check balance
    if (team.pointsBalance < perk.cost) {
      throw new ConvexError("Insufficient points");
    }

    // Purchase
    await ctx.db.patch(team._id, {
      pointsBalance: team.pointsBalance - perk.cost,
    });

    await ctx.db.insert("purchases", {
      teamId: team._id,
      perkId: args.perkId,
      purchasedAt: Date.now(),
    });

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "buy_perk",
      detailsJson: JSON.stringify({
        teamId: team._id,
        perkId: args.perkId,
        cost: perk.cost,
      }),
      createdAt: Date.now(),
    });

    return { message: "Perk purchased" };
  },
});

export const performAction = mutation({
  args: {
    userId: v.id("users"),
    actionType: v.string(),
    targetTeamId: v.optional(v.id("teams")),
    investmentAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const team = await getUserTeam(ctx, args.userId);

    if (!(await isCaptain(ctx, args.userId, team._id))) {
      throw new ConvexError("Only captain can perform actions");
    }

    const now = Date.now();

    if (args.actionType === "attack") {
      if (!args.targetTeamId) {
        throw new ConvexError("Target team required for attack");
      }

      const targetTeam = await ctx.db.get(args.targetTeamId);
      if (!targetTeam) {
        throw new ConvexError("Target team not found");
      }

      // Check immunity
      if (targetTeam.immunityUntil && targetTeam.immunityUntil > now) {
        throw new ConvexError("Target team has immunity");
      }

      // Check shield
      if (targetTeam.shieldActive && targetTeam.shieldExpiry && targetTeam.shieldExpiry > now) {
        throw new ConvexError("Target team has active shield");
      }

      const cost = 50.0;
      if (team.pointsBalance < cost) {
        throw new ConvexError("Insufficient points");
      }

      await ctx.db.patch(team._id, {
        pointsBalance: team.pointsBalance - cost,
      });

      const actionId = await ctx.db.insert("actions", {
        teamId: team._id,
        actionType: "attack",
        targetTeamId: args.targetTeamId,
        cost,
        createdAt: now,
        endsAt: now + 5 * 60 * 1000,
        status: "active",
      });

      // Grant immunity to target
      await ctx.db.patch(args.targetTeamId, {
        immunityUntil: now + 3 * 60 * 1000,
      });

      // Log
      await ctx.db.insert("auditLogs", {
        userId: args.userId,
        action: "attack",
        detailsJson: JSON.stringify({
          attackerTeamId: team._id,
          targetTeamId: args.targetTeamId,
        }),
        createdAt: now,
      });

      return { id: actionId, message: "Attack initiated" };
    } else if (args.actionType === "defend") {
      const cost = 30.0;
      if (team.pointsBalance < cost) {
        throw new ConvexError("Insufficient points");
      }

      const shieldExpiry = now + 10 * 60 * 1000;

      await ctx.db.patch(team._id, {
        pointsBalance: team.pointsBalance - cost,
        shieldActive: true,
        shieldExpiry,
      });

      const actionId = await ctx.db.insert("actions", {
        teamId: team._id,
        actionType: "defend",
        cost,
        createdAt: now,
        endsAt: shieldExpiry,
        status: "active",
      });

      // Log
      await ctx.db.insert("auditLogs", {
        userId: args.userId,
        action: "defend",
        detailsJson: JSON.stringify({ teamId: team._id }),
        createdAt: now,
      });

      return { id: actionId, message: "Shield activated" };
    } else if (args.actionType === "invest") {
      if (!args.investmentAmount) {
        throw new ConvexError("Investment amount required");
      }

      if (team.pointsBalance < args.investmentAmount) {
        throw new ConvexError("Insufficient points");
      }

      await ctx.db.patch(team._id, {
        pointsBalance: team.pointsBalance - args.investmentAmount,
      });

      const actionId = await ctx.db.insert("actions", {
        teamId: team._id,
        actionType: "invest",
        cost: args.investmentAmount,
        resultJson: JSON.stringify({ invested: args.investmentAmount }),
        createdAt: now,
        status: "pending",
      });

      // Log
      await ctx.db.insert("auditLogs", {
        userId: args.userId,
        action: "invest",
        detailsJson: JSON.stringify({
          teamId: team._id,
          amount: args.investmentAmount,
        }),
        createdAt: now,
      });

      return { id: actionId, message: "Investment made" };
    }

    throw new ConvexError("Invalid action type");
  },
});

export const unlockRoom = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const team = await getUserTeam(ctx, args.userId);

    if (!(await isCaptain(ctx, args.userId, team._id))) {
      throw new ConvexError("Only captain can unlock rooms");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new ConvexError("Room not found");
    }

    // Check if can unlock (must be next room)
    if (team.currentRoomId) {
      const currentRoom = await ctx.db.get(team.currentRoomId);
      if (currentRoom && "orderIndex" in currentRoom && room.orderIndex !== currentRoom.orderIndex + 1) {
        throw new ConvexError("Must unlock rooms in order");
      }
    } else {
      if (room.orderIndex !== 1) {
        throw new ConvexError("Must start with Room 1");
      }
    }

    // Check cost
    if (team.pointsBalance < room.unlockCost) {
      throw new ConvexError("Insufficient points");
    }

    await ctx.db.patch(team._id, {
      pointsBalance: team.pointsBalance - room.unlockCost,
      currentRoomId: args.roomId,
    });

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "unlock_room",
      detailsJson: JSON.stringify({
        teamId: team._id,
        roomId: args.roomId,
      }),
      createdAt: Date.now(),
    });

    return { message: `Unlocked ${room.name}` };
  },
});

// Rules and onboarding functions
export const getActiveRules = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("rules")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const submitRulesFlag = mutation({
  args: {
    teamId: v.id("teams"),
    flag: v.string(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    // Check if team already submitted
    if (team.rulesFlagSubmitted) {
      return { success: false, message: "Team already submitted the rules flag" };
    }

    const rules = await ctx.db
      .query("rules")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!rules) {
      throw new ConvexError("No active rules found");
    }

    // Check flag
    const hashedInput = await hashFlag(args.flag);
    if (hashedInput === rules.hiddenFlag) {
      // Award points and mark as submitted
      await ctx.db.patch(args.teamId, {
        pointsBalance: team.pointsBalance + 100,
        rulesFlagSubmitted: true,
      });

      await ctx.db.insert("auditLogs", {
        action: "rules_flag_bonus",
        detailsJson: JSON.stringify({ teamId: args.teamId, points: 100 }),
        createdAt: Date.now(),
      });

      return { success: true, points: 100 };
    } else {
      return { success: false, message: "Incorrect flag" };
    }
  },
});
