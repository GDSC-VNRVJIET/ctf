import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Helper to generate invite codes
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to check rate limit
async function checkRateLimit(
  ctx: any,
  userId: string,
  action: string,
  limit: number,
  windowMinutes: number
) {
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  const recentActions = await ctx.db
    .query("auditLogs")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => 
      q.and(
        q.eq(q.field("action"), action),
        q.gte(q.field("createdAt"), cutoff)
      )
    )
    .collect();

  if (recentActions.length >= limit) {
    throw new ConvexError(`Rate limit exceeded for ${action}. Try again later.`);
  }
}

// Mutations
export const createTeam = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate capacity
    if (args.capacity < 2 || args.capacity > 5) {
      throw new ConvexError("Team capacity must be between 2 and 5");
    }

    // Rate limiting
    await checkRateLimit(ctx, args.userId, "create_team", 3, 60);

    // Check if user already in a team
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingMembership) {
      throw new ConvexError("Already in a team");
    }

    // Check team name uniqueness
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existingTeam) {
      throw new ConvexError("Team name already taken");
    }

    // Create team
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      description: args.description,
      captainUserId: args.userId,
      capacity: args.capacity,
      pointsBalance: 0,
      inviteCode: generateInviteCode(),
      shieldActive: false,
      createdAt: Date.now(),
      nameVerified: true, // Name verified as unique
    });

    // Add creator as captain
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: args.userId,
      role: "captain",
      joinedAt: Date.now(),
    });

    // Update user role
    await ctx.db.patch(args.userId, { role: "team_captain" });

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "create_team",
      detailsJson: JSON.stringify({
        teamId,
        teamName: args.name,
        capacity: args.capacity,
      }),
      createdAt: Date.now(),
    });

    return { teamId, message: "Team created successfully" };
  },
});

export const requestJoinTeam = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    inviteCode: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limiting
    await checkRateLimit(ctx, args.userId, "request_join_team", 5, 30);

    // Check if user already in a team
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingMembership) {
      throw new ConvexError("Already in a team");
    }

    // Get team
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    // Verify invite code
    if (team.inviteCode !== args.inviteCode) {
      // Log failed attempt
      await ctx.db.insert("auditLogs", {
        userId: args.userId,
        action: "failed_join_attempt",
        detailsJson: JSON.stringify({
          teamId: args.teamId,
          reason: "invalid_invite_code",
          ipAddress: args.ipAddress,
        }),
        createdAt: Date.now(),
      });
      throw new ConvexError("Invalid invite code");
    }

    // Check capacity
    const memberCount = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (memberCount.length >= team.capacity) {
      throw new ConvexError("Team is full");
    }

    // Check if user already has a pending request
    const existingRequest = await ctx.db
      .query("teamJoinRequests")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (existingRequest) {
      throw new ConvexError("Join request already pending");
    }

    // Create join request
    await ctx.db.insert("teamJoinRequests", {
      teamId: args.teamId,
      userId: args.userId,
      status: "pending",
      requestedAt: Date.now(),
    });

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "request_join_team",
      detailsJson: JSON.stringify({
        teamId: args.teamId,
        teamName: team.name,
        ipAddress: args.ipAddress,
      }),
      createdAt: Date.now(),
    });

    return { message: "Join request sent successfully" };
  },
});

export const acceptJoinRequest = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    requestId: v.id("teamJoinRequests"),
  },
  handler: async (ctx, args) => {
    // Verify captain
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (!membership || membership.role !== "captain") {
      throw new ConvexError("Team captain access required");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team || team.captainUserId !== args.userId) {
      throw new ConvexError("Team captain access required");
    }

    // Get request
    const request = await ctx.db.get(args.requestId);
    if (!request || request.teamId !== args.teamId || request.status !== "pending") {
      throw new ConvexError("Request not found");
    }

    // Check capacity
    const memberCount = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (memberCount.length >= team.capacity) {
      await ctx.db.patch(args.requestId, {
        status: "rejected",
        respondedAt: Date.now(),
      });
      throw new ConvexError("Team is full");
    }

    // Check if user already in another team
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", request.userId))
      .first();

    if (existingMembership) {
      await ctx.db.patch(args.requestId, {
        status: "rejected",
        respondedAt: Date.now(),
      });
      throw new ConvexError("User already in a team");
    }

    // Add member
    await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: request.userId,
      role: "member",
      joinedAt: Date.now(),
    });

    // Update request
    await ctx.db.patch(args.requestId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "accept_join_request",
      detailsJson: JSON.stringify({
        teamId: args.teamId,
        teamName: team.name,
        newUserId: request.userId,
        requestId: args.requestId,
      }),
      createdAt: Date.now(),
    });

    return { message: "Join request accepted" };
  },
});

export const rejectJoinRequest = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    requestId: v.id("teamJoinRequests"),
  },
  handler: async (ctx, args) => {
    // Verify captain
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (!membership || membership.role !== "captain") {
      throw new ConvexError("Team captain access required");
    }

    // Get request
    const request = await ctx.db.get(args.requestId);
    if (!request || request.teamId !== args.teamId || request.status !== "pending") {
      throw new ConvexError("Request not found");
    }

    // Update request
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      respondedAt: Date.now(),
    });

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "reject_join_request",
      detailsJson: JSON.stringify({
        teamId: args.teamId,
        rejectedUserId: request.userId,
        requestId: args.requestId,
      }),
      createdAt: Date.now(),
    });

    return { message: "Join request rejected" };
  },
});

export const leaveTeam = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Rate limiting
    await checkRateLimit(ctx, args.userId, "leave_team", 3, 60);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!membership) {
      throw new ConvexError("Not in any team");
    }

    const team = await ctx.db.get(membership.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    if (team.captainUserId === args.userId) {
      throw new ConvexError("Captain cannot leave team. Use delete team instead.");
    }

    // Remove membership
    await ctx.db.delete(membership._id);

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "leave_team",
      detailsJson: JSON.stringify({
        teamId: team._id,
        teamName: team.name,
      }),
      createdAt: Date.now(),
    });

    return { message: "Left team successfully" };
  },
});

export const deleteTeam = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // Rate limiting
    await checkRateLimit(ctx, args.userId, "delete_team", 2, 120);

    // Verify captain
    const team = await ctx.db.get(args.teamId);
    if (!team || team.captainUserId !== args.userId) {
      throw new ConvexError("Team captain access required");
    }

    // Get counts for audit log
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const pendingRequests = await ctx.db
      .query("teamJoinRequests")
      .withIndex("by_team_and_status", (q) => 
        q.eq("teamId", args.teamId).eq("status", "pending")
      )
      .collect();

    // Delete all team members
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all join requests
    for (const request of pendingRequests) {
      await ctx.db.delete(request._id);
    }

    // Delete team
    await ctx.db.delete(args.teamId);

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "delete_team",
      detailsJson: JSON.stringify({
        teamId: args.teamId,
        teamName: team.name,
        deletedMembers: members.length,
        deletedPendingRequests: pendingRequests.length,
      }),
      createdAt: Date.now(),
    });

    return { message: "Team deleted successfully" };
  },
});

export const removeTeamMember = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify captain
    const team = await ctx.db.get(args.teamId);
    if (!team || team.captainUserId !== args.userId) {
      throw new ConvexError("Team captain access required");
    }

    if (args.targetUserId === args.userId) {
      throw new ConvexError("Cannot remove yourself from team");
    }

    // Get target membership
    const targetMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", args.targetUserId)
      )
      .first();

    if (!targetMembership) {
      throw new ConvexError("User is not a member of this team");
    }

    // Remove membership
    await ctx.db.delete(targetMembership._id);

    // Log
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "remove_team_member",
      detailsJson: JSON.stringify({
        teamId: args.teamId,
        removedUserId: args.targetUserId,
      }),
      createdAt: Date.now(),
    });

    return { message: "Member removed successfully" };
  },
});

// Queries
export const getTeam = query({
  args: { userId: v.id("users"), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("Not authorized to view this team");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    return team;
  },
});

export const getMyTeam = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!membership) {
      return null;
    }

    const team = await ctx.db.get(membership.teamId);
    return team;
  },
});

export const getTeamMembers = query({
  args: { userId: v.id("users"), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("Not authorized to view this team's members");
    }

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Fetch user details for each member
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user: user ? {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          } : null,
        };
      })
    );

    return membersWithUsers;
  },
});

export const getTeamJoinRequests = query({
  args: { userId: v.id("users"), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // Verify captain
    const team = await ctx.db.get(args.teamId);
    if (!team || team.captainUserId !== args.userId) {
      throw new ConvexError("Team captain access required");
    }

    const requests = await ctx.db
      .query("teamJoinRequests")
      .withIndex("by_team_and_status", (q) => 
        q.eq("teamId", args.teamId).eq("status", "pending")
      )
      .collect();

    // Fetch user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const user = await ctx.db.get(request.userId);
        return {
          ...request,
          user: user ? {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          } : null,
        };
      })
    );

    return requestsWithUsers;
  },
});

export const getTeamByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_invite", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!team) {
      throw new ConvexError("Team not found");
    }

    return team;
  },
});

export const getAvailableTeams = query({
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();

    // Filter teams that are not full and get member counts
    const availableTeams = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        return {
          ...team,
          members: members.length,
          isAvailable: members.length < team.capacity,
        };
      })
    );

    return availableTeams.filter(team => team.isAvailable);
  },
});

export const getUserTeam = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!membership) {
      return null;
    }

    const team = await ctx.db.get(membership.teamId);
    if (!team) {
      return null;
    }

    // Get member count
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();

    return {
      ...team,
      members: members.length,
    };
  },
});
