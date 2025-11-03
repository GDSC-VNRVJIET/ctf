import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

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

const getTeamName = async (ctx: any, teamId: Id<"teams">): Promise<string> => {
  const team = await ctx.db.get(teamId);
  return team?.name ?? "Unknown Team";
};

// Define the structure of a single notification object
interface Notification {
  actionType: string;
  createdAt: number;
  cost: number;
  // Common for Invest
  teamId?: Id<"teams">;
  // Common for Attack/Defend
  targetTeamId?: Id<"teams">;
  targetTeamName?: string;
  teamName?: string;
  // Specific notification message field
  notificationType: "Invested" | "Attacked" | "BeingAttacked" | "Defended" | "AttackDefended";
  cooldownUntil?: number;
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

export const getNotifications = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const { teamId } = args;

    // 1. Fetch all relevant actions for the given teamId
    // We need actions where the team is the initiator (teamId) OR the target (targetTeamId)
    
    // Actions where the team is the initiator
    const initiatedActions = await ctx.db
      .query("actions")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Actions where the team is the target, and filter out duplicates if possible
    // Note: We'll filter for duplicates later, as fetching is easier this way.
    const targetedActions = await ctx.db
      .query("actions")
      .withIndex("by_target", (q) => q.eq("targetTeamId", teamId))
      .collect();

    // Combine and de-duplicate the actions
    const allActionsMap = new Map<Id<"actions">, Doc<"actions">>();
    [...initiatedActions, ...targetedActions].forEach(action => {
        allActionsMap.set(action._id, action);
    });
    const allActions = Array.from(allActionsMap.values());

    // 2. Process and map actions to the required notification format
    const notifications: Notification[] = [];

    for (const action of allActions) {
      const isInitiator = action.teamId === teamId;

      const baseNotification: Partial<Notification> = {
        actionType: action.actionType,
        createdAt: action.createdAt,
        cost: action.cost,
      };
      
      let notification: Notification | null = null;

      // --- 1. 'invest' Actions ---
      if (action.actionType === 'invest') {
        // Only the initiator team's ID is present in 'teamId' for 'invest'
        if (isInitiator) {
          notification = {
            ...baseNotification,
            teamId: action.teamId,
            teamName: await getTeamName(ctx, action.teamId),
            notificationType: "Invested",
          } as Notification;
        }
      } 
      
      // --- 2. 'attack' Actions ---
      else if (action.actionType === 'attack') {
        const otherTeamId = isInitiator ? action.targetTeamId : action.teamId;
        const otherTeamName = otherTeamId ? await getTeamName(ctx, otherTeamId) : "Unknown Target";
        
        if (isInitiator) {
          // Team is attacking
          notification = {
            ...baseNotification,
            teamId: action.teamId,
            teamName: await getTeamName(ctx, action.teamId),
            targetTeamId: action.targetTeamId,
            targetTeamName: otherTeamName,
            notificationType: "Attacked",
            cooldownUntil: action.cooldownUntil,
          } as Notification;
        } else {
          // Team is being attacked
          notification = {
            ...baseNotification,
            teamId: action.teamId,
            teamName: otherTeamName, // Attacking team's name
            targetTeamId: action.targetTeamId,
            targetTeamName: await getTeamName(ctx, teamId), // Our team's name
            notificationType: "BeingAttacked",
            cooldownUntil: action.cooldownUntil,
          } as Notification;
        }
      } 
      
      // --- 3. 'defend' Actions ---
      else if (action.actionType === 'defend') {
        const otherTeamId = isInitiator ? action.targetTeamId : action.teamId;
        const otherTeamName = otherTeamId ? await getTeamName(ctx, otherTeamId) : "Unknown Team";

        if (isInitiator) {
          // Team is defending another team's attack
          notification = {
            ...baseNotification,
            teamId: action.teamId,
            teamName: await getTeamName(ctx, action.teamId),
            targetTeamId: action.targetTeamId,
            targetTeamName: otherTeamName,
            notificationType: "Defended",
            cooldownUntil: action.cooldownUntil,
          } as Notification;
        } else {
          // Team's attack was defended (targetTeamId matches)
          notification = {
            ...baseNotification,
            teamId: action.teamId,
            teamName: otherTeamName, // Defending team's name
            targetTeamId: action.targetTeamId,
            targetTeamName: await getTeamName(ctx, teamId), // Our team's name
            notificationType: "AttackDefended",
            cooldownUntil: action.cooldownUntil,
          } as Notification;
        }
      }

      if (notification) {
        notifications.push(notification);
      }
    }
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    return notifications;
  },
});

export const getTeam = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await getUserTeam(ctx, args.userId);
  }
})

export const getRoomOfUser = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const team = await getUserTeam(ctx, args.userId);
    const room = team.currentRoomId;
    const roomNumber = room.orderIndex;
    return roomNumber;
  }
})

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

        // Get highest room index for ranking
        let highestRoomIndex = 0;
        let highestRoomName = "Not Started";
        if (team.highestRoomId) {
          const highestRoom = await ctx.db.get(team.highestRoomId);
          if (highestRoom) {
            highestRoomIndex = highestRoom.orderIndex;
            highestRoomName = highestRoom.name;
          }
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
          highestRoomIndex,
          highestRoomName,
          shieldActive: team.shieldActive && team.shieldExpiry && team.shieldExpiry > now,
          underAttack: !!activeAttacks,
        };
      })
    );

    // Sort by highest room first (descending), then by points (descending)
    return leaderboard.sort((a, b) => {
      if (b.highestRoomIndex !== a.highestRoomIndex) {
        return b.highestRoomIndex - a.highestRoomIndex;
      }
      return b.pointsBalance - a.pointsBalance;
    });
  },
});

export const getPerks = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("perks").collect();
  },
});

export const getCluesByPuzzle = query({
  args: { puzzleId: v.id("puzzles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clues")
      .withIndex("by_puzzle", (q) => q.eq("puzzleId", args.puzzleId))
      .order("asc")
      .collect();
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
      let pointsAwarded = puzzle.pointsReward;

      // Check if this is a challenge question
      if (puzzle.isChallenge) {
        const attempt = await ctx.db
          .query("challengeAttempts")
          .withIndex("by_team_and_challenge", (q) =>
            q.eq("teamId", team._id).eq("challengeId", args.puzzleId)
          )
          .filter((q) => q.eq(q.field("isCompleted"), false))
          .first();

        if (!attempt) {
          throw new ConvexError("No active challenge attempt. Start the challenge first.");
        }

        // Check if timer expired
        if (now > attempt.endsAt) {
          // Mark attempt as completed (failed)
          await ctx.db.patch(attempt._id, {
            isCompleted: true,
            isPassed: false,
          });
          throw new ConvexError("Challenge timer expired. Investment lost.");
        }

        // Apply multiplier
        const multiplier = puzzle.challengePointsMultiplier || 2;
        pointsAwarded = Math.floor(puzzle.pointsReward * multiplier);

        // Mark attempt as passed
        await ctx.db.patch(attempt._id, {
          isCompleted: true,
          isPassed: true,
          solvedAt: now,
        });
      }

      // Award points
      await ctx.db.patch(team._id, {
        pointsBalance: team.pointsBalance + pointsAwarded,
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
          points: pointsAwarded,
          isChallenge: puzzle.isChallenge || false,
        }),
        createdAt: Date.now(),
      });

      return { message: "Correct flag!", pointsAwarded };
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

export const dummyAction = mutation({
  args: {
    teamId: v.id("teams")
  },
  handler: async (ctx, args) => {
    const actionId = await ctx.db.insert("actions", {
        teamId: args.teamId,
        actionType: "invest",
        cost: 0,
        resultJson: JSON.stringify({ invested: 0 }),
        createdAt: Date.now(),
        status: "pending",
      });
    
    return actionId;
  }
})

export const buyPerk = mutation({
  args: {
    userId: v.id("users"),
    perkId: v.id("perks"),
    orderIndex: v.number()
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

      // Check if attacker is on cooldown
      if (team.lastAttackTime && team.lastAttackTime + 5 * 60 * 1000 > now) {
        const remainingMs = team.lastAttackTime + 5 * 60 * 1000 - now;
        const remainingMin = Math.ceil(remainingMs / 60000);
        throw new ConvexError(`Attack cooldown active. Wait ${remainingMin} more minute(s).`);
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
        lastAttackTime: now, // Set cooldown
      });

      const cooldownUntil = now + 5 * 60 * 1000;

      const actionId = await ctx.db.insert("actions", {
        teamId: team._id,
        actionType: "attack",
        targetTeamId: args.targetTeamId,
        cost,
        createdAt: now,
        endsAt: now + 5 * 60 * 1000,
        status: "active",
        cooldownUntil, // Track cooldown expiry
      });

      // Grant 5-minute immunity to target
      await ctx.db.patch(args.targetTeamId, {
        immunityUntil: now + 5 * 60 * 1000,
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
      // Check if shield already active
      if (team.shieldActive && team.shieldExpiry && team.shieldExpiry > now) {
        throw new ConvexError("Shield already active");
      }

      // Check if team is under attack
      const activeAttacks = await ctx.db
        .query("actions")
        .withIndex("by_target_and_status", (q) =>
          q.eq("targetTeamId", team._id).eq("status", "active")
        )
        .filter((q) => q.eq(q.field("actionType"), "attack"))
        .collect();

      if (activeAttacks.length > 0) {
        throw new ConvexError("Cannot activate shield while under attack");
      }

      const cost = 30.0;
      if (team.pointsBalance < cost) {
        throw new ConvexError("Insufficient points");
      }

      const shieldExpiry = now + 5 * 60 * 1000; // Changed to 5 minutes

      await ctx.db.patch(team._id, {
        pointsBalance: team.pointsBalance - cost,
        shieldActive: true,
        shieldExpiry,
        shieldPurchaseTime: now,
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

// Challenge Question Queries and Mutations
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

    return attempt;
  },
});

export const startChallengeAttempt = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("puzzles"),
  },
  handler: async (ctx, args) => {
    const team = await getUserTeam(ctx, args.userId);
    
    if (!(await isCaptain(ctx, args.userId, team._id))) {
      throw new ConvexError("Only captain can start challenge attempts");
    }

    // Get challenge
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || !challenge.isActive) {
      throw new ConvexError("Challenge not found or inactive");
    }

    if (!challenge.isChallenge) {
      throw new ConvexError("This is not a challenge question");
    }

    // Check if already has active attempt
    const existingAttempt = await ctx.db
      .query("challengeAttempts")
      .withIndex("by_team_and_challenge", (q) =>
        q.eq("teamId", team._id).eq("challengeId", args.challengeId)
      )
      .filter((q) => q.eq(q.field("isCompleted"), false))
      .first();

    if (existingAttempt) {
      throw new ConvexError("Challenge attempt already in progress");
    }

    // Check if already solved
    const existingCorrect = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_puzzle", (q) =>
        q.eq("teamId", team._id).eq("puzzleId", args.challengeId)
      )
      .filter((q) => q.eq(q.field("isCorrect"), true))
      .first();

    if (existingCorrect) {
      throw new ConvexError("Challenge already solved");
    }

    // Calculate investment (50% of points reward)
    const investment = Math.floor(challenge.pointsReward * 0.5);
    
    if (team.pointsBalance < investment) {
      throw new ConvexError(`Insufficient points. Need ${investment} points to start.`);
    }

    // Deduct investment
    await ctx.db.patch(team._id, {
      pointsBalance: team.pointsBalance - investment,
    });

    // Create attempt
    const now = Date.now();
    const timerMinutes = challenge.challengeTimerMinutes || 10;
    const endsAt = now + timerMinutes * 60 * 1000;

    const attemptId = await ctx.db.insert("challengeAttempts", {
      teamId: team._id,
      challengeId: args.challengeId,
      startedAt: now,
      endsAt,
      investment,
      isCompleted: false,
    });

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "start_challenge",
      detailsJson: JSON.stringify({
        teamId: team._id,
        challengeId: args.challengeId,
        investment,
      }),
      createdAt: now,
    });

    return {
      attemptId,
      timerMinutes,
      investment,
      message: "Challenge started! Timer is running.",
    };
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

    // Update highestRoomId if this room is higher than current highest
    let updateData: any = {
      pointsBalance: team.pointsBalance - room.unlockCost,
      currentRoomId: args.roomId,
    };

    // If no highestRoomId or this room is higher, update it
    if (!team.highestRoomId) {
      updateData.highestRoomId = args.roomId;
    } else {
      const currentHighest = await ctx.db.get(team.highestRoomId);
      if (currentHighest && "orderIndex" in currentHighest && room.orderIndex > currentHighest.orderIndex) {
        updateData.highestRoomId = args.roomId;
      }
    }

    await ctx.db.patch(team._id, updateData);

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

// Migration helper: Initialize highestRoomId for existing teams
export const initializeHighestRoomIds = mutation({
  args: {},
  handler: async (ctx, args) => {
    const teams = await ctx.db.query("teams").collect();
    let updatedCount = 0;

    for (const team of teams) {
      // Only update if highestRoomId is not set but team has currentRoomId
      if (!team.highestRoomId) {
        let highestRoomId = null;

        if (team.currentRoomId) {
          // Use current room as the highest
          highestRoomId = team.currentRoomId;
        } else {
          // Get the first room for teams that haven't started
          const firstRoom = await ctx.db
            .query("rooms")
            .filter((q: any) => q.eq(q.field("orderIndex"), 1))
            .first();
          if (firstRoom) {
            highestRoomId = firstRoom._id;
          }
        }

        if (highestRoomId) {
          await ctx.db.patch(team._id, {
            highestRoomId,
          });
          updatedCount++;
        }
      }
    }

    return {
      success: true,
      message: `Initialized highestRoomId for ${updatedCount} teams`,
      updatedCount,
    };
  },
});
