import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all rooms
export const getRooms = query({
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .collect();

    return rooms.map(room => ({
      id: room._id,
      name: room.name,
      order_index: room.order_index,
      description: room.description,
      unlock_cost: room.unlock_cost,
      is_challenge: room.is_challenge,
    }));
  },
});

// Get room by ID
export const getRoom = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("_id"), args.roomId))
      .first();
    if (!room) return null;

    const puzzles = await ctx.db
      .query("puzzles")
      .filter((q) => q.eq(q.field("room_id"), room._id))
      .collect();

    return {
      id: room._id,
      name: room.name,
      order_index: room.order_index,
      description: room.description,
      unlock_cost: room.unlock_cost,
      is_challenge: room.is_challenge,
      puzzles: puzzles.map(puzzle => ({
        id: puzzle._id,
        title: puzzle.title,
        description: puzzle.description,
        points: puzzle.points,
        order_index: puzzle.order_index,
      })),
    };
  },
});

// Get puzzles for room
export const getRoomPuzzles = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const puzzles = await ctx.db
      .query("puzzles")
      .filter((q) => q.eq(q.field("room_id"), args.roomId as any))
      .collect();

    return puzzles.map(puzzle => ({
      id: puzzle._id,
      title: puzzle.title,
      description: puzzle.description,
      points: puzzle.points,
      order_index: puzzle.order_index,
    }));
  },
});

// Get puzzle by ID
export const getPuzzle = query({
  args: { puzzleId: v.string() },
  handler: async (ctx, args) => {
    const puzzle = await ctx.db
      .query("puzzles")
      .filter((q) => q.eq(q.field("_id"), args.puzzleId))
      .first();
    if (!puzzle) return null;

    const clues = await ctx.db
      .query("clues")
      .filter((q) => q.eq(q.field("puzzle_id"), puzzle._id))
      .collect();

    return {
      id: puzzle._id,
      room_id: puzzle.room_id,
      title: puzzle.title,
      description: puzzle.description,
      points: puzzle.points,
      flag_hash: puzzle.flag_hash,
      order_index: puzzle.order_index,
      clues: clues.map(clue => ({
        id: clue._id,
        content: clue.content,
        cost: clue.cost,
      })),
    };
  },
});

// Submit flag
export const submitFlag = mutation({
  args: {
    teamId: v.string(),
    puzzleId: v.string(),
    userId: v.string(),
    flagHash: v.string(),
  },
  handler: async (ctx, args) => {
    const puzzle = await ctx.db
      .query("puzzles")
      .filter((q) => q.eq(q.field("_id"), args.puzzleId))
      .first();
    if (!puzzle) {
      throw new Error("Puzzle not found");
    }

    const isCorrect = puzzle.flag_hash === args.flagHash;

    // Check if already solved
    const existingSubmission = await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .filter((q) => q.eq(q.field("puzzle_id"), args.puzzleId as any))
      .first();

    if (existingSubmission && existingSubmission.is_correct) {
      return { correct: false, message: "Already solved" };
    }

    // Record submission
    await ctx.db.insert("submissions", {
      team_id: args.teamId as any,
      puzzle_id: args.puzzleId as any,
      user_id: args.userId as any,
      is_correct: isCorrect,
      submitted_at: Date.now(),
    });

    if (isCorrect && !existingSubmission) {
      // Award points to team
      const team = await ctx.db
        .query("teams")
        .filter((q) => q.eq(q.field("_id"), args.teamId))
        .first();
      if (team) {
        await ctx.db.patch(args.teamId as any, {
          points_balance: team.points_balance + puzzle.points,
        });
      }
    }

    return { correct: isCorrect };
  },
});

// Get leaderboard
export const getLeaderboard = query({
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();

    const leaderboard = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("teamMembers")
          .filter((q) => q.eq(q.field("team_id"), team._id))
          .collect();

        const submissions = await ctx.db
          .query("submissions")
          .filter((q) => q.eq(q.field("team_id"), team._id))
          .collect();

        const solvedPuzzles = submissions.filter(s => s.is_correct).length;
        const roomIndex = team.current_room_id ? 0 : 0; // Need to calculate this properly

        const score = team.points_balance + (solvedPuzzles * 100) + (roomIndex * 500);

        return {
          team_id: team._id,
          team_name: team.name,
          score: score,
          room_index: roomIndex,
          points_balance: team.points_balance,
          shield_active: team.shield_active && (team.shield_expiry || 0) > Date.now(),
          under_attack: false, // Need to check active actions
          member_count: members.length,
          disabled: team.disabled,
        };
      })
    );

    return leaderboard
      .filter(team => !team.disabled)
      .sort((a, b) => b.points_balance - a.points_balance);
  },
});

// Perform action (attack, defense, etc.)
export const performAction = mutation({
  args: {
    teamId: v.string(),
    actionType: v.string(),
    targetTeamId: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("_id"), args.teamId))
      .first();
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if team has enough points
    const actionCost = 100; // Define costs based on action type
    if (team.points_balance < actionCost) {
      throw new Error("Insufficient points");
    }

    // Deduct points
    await ctx.db.patch(args.teamId as any, {
      points_balance: team.points_balance - actionCost,
    });

    // Create action
    const endsAt = args.duration ? Date.now() + (args.duration * 1000) : undefined;

    const actionId = await ctx.db.insert("actions", {
      team_id: args.teamId as any,
      target_team_id: args.targetTeamId as any,
      action_type: args.actionType,
      status: "active",
      ends_at: endsAt,
      created_at: Date.now(),
    });

    return { id: actionId };
  },
});

// Get team submissions
export const getTeamSubmissions = query({
  args: { teamId: v.string() },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .collect();

    return submissions.map(submission => ({
      id: submission._id,
      puzzle_id: submission.puzzle_id,
      is_correct: submission.is_correct,
      submitted_at: submission.submitted_at,
    }));
  },
});

// Get available perks
export const getPerks = query({
  handler: async (ctx) => {
    const perks = await ctx.db.query("perks").collect();
    return perks.map(perk => ({
      id: perk._id,
      name: perk.name,
      description: perk.description,
      cost: perk.cost,
      effect_type: perk.effect_type,
      effect_value: perk.effect_value,
    }));
  },
});

// Purchase perk
export const purchasePerk = mutation({
  args: {
    teamId: v.string(),
    perkId: v.string(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("_id"), args.teamId))
      .first();
    const perk = await ctx.db
      .query("perks")
      .filter((q) => q.eq(q.field("_id"), args.perkId))
      .first();

    if (!team || !perk) {
      throw new Error("Team or perk not found");
    }

    if (team.points_balance < perk.cost) {
      throw new Error("Insufficient points");
    }

    // Apply perk effect
    let updates = {};
    if (perk.effect_type === "shield") {
      updates = {
        shield_active: true,
        shield_expiry: Date.now() + (perk.effect_value * 1000),
        points_balance: team.points_balance - perk.cost,
      };
    } else if (perk.effect_type === "points_multiplier") {
      // Handle other perk types
      updates = {
        points_balance: team.points_balance - perk.cost,
      };
    }

    await ctx.db.patch(args.teamId as any, updates);
    return { success: true };
  },
});
