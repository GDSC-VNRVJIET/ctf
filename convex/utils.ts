/**
 * Common utility functions used across Convex backend
 */

// Constants
const SECRET_KEY = "your-secret-key-change-in-production";
const TOKEN_EXPIRE_HOURS = 24;

/**
 * Hash a password using SHA-256 with salt (bcrypt-style)
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  // Generate random salt if not provided
  const actualSalt = salt || Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Truncate password if too long (bcrypt has 72 byte limit)
  const passwordBytes = new TextEncoder().encode(password);
  const truncatedPassword = passwordBytes.length > 72 
    ? new TextDecoder().decode(passwordBytes.slice(0, 72))
    : password;
  
  // Hash with salt and secret key
  const encoder = new TextEncoder();
  const data = encoder.encode(truncatedPassword + actualSalt + SECRET_KEY);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  // Return salt + hash (bcrypt format: $algorithm$salt$hash)
  return `$sha256$${actualSalt}$${hash}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Parse stored hash: $algorithm$salt$hash
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    
    const salt = parts[2];
    const hash = parts[3];
    
    // Hash the input password with the stored salt
    const computedHash = await hashPassword(password, salt);
    const computedHashPart = computedHash.split('$')[3];
    
    // Constant-time comparison
    return computedHashPart === hash;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a JWT-like token with signature
 */
export function generateToken(userId: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { 
    sub: userId, 
    exp: Date.now() + TOKEN_EXPIRE_HOURS * 60 * 60 * 1000,
    iat: Date.now() 
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Create signature (simplified - in production use proper HMAC)
  const signature = btoa(encodedHeader + encodedPayload + SECRET_KEY).slice(0, 43);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): { userId: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp < Date.now()) {
      return null;
    }
    
    // Verify signature (simplified)
    const expectedSig = btoa(parts[0] + parts[1] + SECRET_KEY).slice(0, 43);
    if (parts[2] !== expectedSig) {
      return null;
    }
    
    return { userId: payload.sub, exp: payload.exp };
  } catch (error) {
    return null;
  }
}

/**
 * Hash a flag for storage and comparison
 */
export async function hashFlag(flag: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(flag + "SECRET_SALT_FOR_FLAGS_CHANGE_IN_PRODUCTION");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate flag format to prevent injection attacks
 */
// export function validateFlagFormat(flag: string): boolean {
//   if (!flag || flag.length > 500) return false;
  
//   // Allow alphanumeric, underscores, hyphens, braces only
//   const pattern = /^[A-Za-z0-9_\-{}\[\]@:.]+$/;
  
//   // Check for suspicious patterns
//   if (/['\";<>&|]/.test(flag)) return false;
  
//   return pattern.test(flag);
// }

/**
 * Generate a random invite code
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check rate limit for a user action
 */
export async function checkRateLimit(
  ctx: any,
  userId: string,
  action: string,
  limit: number,
  windowMinutes: number
): Promise<void> {
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
    throw new Error(`Rate limit exceeded for ${action}. Try again later.`);
  }
}

/**
 * Check submission rate limit for flag submissions
 */
export async function checkSubmissionRateLimit(
  ctx: any,
  teamId: string,
  puzzleId: string,
  limit: number = 10,
  windowMinutes: number = 5
): Promise<void> {
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  
  const recentSubmissions = await ctx.db
    .query("submissions")
    .withIndex("by_team_and_puzzle", (q: any) => 
      q.eq("teamId", teamId).eq("puzzleId", puzzleId)
    )
    .filter((q: any) => q.gte(q.field("submissionTime"), cutoff))
    .collect();

  if (recentSubmissions.length >= limit) {
    throw new Error("Too many flag submissions. Please wait before trying again.");
  }
}

/**
 * Get user's team
 */
export async function getUserTeam(ctx: any, userId: string) {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!membership) {
    throw new Error("Not in any team");
  }

  const team = await ctx.db.get(membership.teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  return team;
}

/**
 * Check if user is team captain
 */
export async function isCaptain(ctx: any, userId: string, teamId: string): Promise<boolean> {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q: any) => 
      q.eq("teamId", teamId).eq("userId", userId)
    )
    .first();

  return membership && membership.role === "captain";
}

/**
 * Check if user is admin or organiser
 */
export async function requireAdmin(ctx: any, userId: string): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user || (user.role !== "admin" && user.role !== "organiser")) {
    throw new Error("Admin access required");
  }
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
  ctx: any,
  userId: string | null,
  action: string,
  details: Record<string, any>
): Promise<void> {
  await ctx.db.insert("auditLogs", {
    userId: userId || undefined,
    action,
    detailsJson: JSON.stringify({
      ...details,
      timestamp: new Date().toISOString(),
    }),
    createdAt: Date.now(),
  });
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Calculate team score for leaderboard
 */
export function calculateTeamScore(
  pointsBalance: number,
  solvedPuzzles: number,
  roomIndex: number
): number {
  return pointsBalance + (solvedPuzzles * 100) + (roomIndex * 500);
}

/**
 * Check if timestamp is expired
 */
export function isExpired(timestamp: number | null | undefined): boolean {
  if (!timestamp) return true;
  return timestamp < Date.now();
}
