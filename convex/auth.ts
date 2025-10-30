import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

const SECRET_KEY = "your-secret-key-change-in-production";
const TOKEN_EXPIRE_HOURS = 24;

async function hashPassword(password: string, salt?: string): Promise<string> {
  const actualSalt = salt || Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const passwordBytes = new TextEncoder().encode(password);
  const truncatedPassword = passwordBytes.length > 72 
    ? new TextDecoder().decode(passwordBytes.slice(0, 72))
    : password;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(truncatedPassword + actualSalt + SECRET_KEY);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return `$sha256$${actualSalt}$${hash}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    
    const salt = parts[2];
    const hash = parts[3];
    
    const computedHash = await hashPassword(password, salt);
    const computedHashPart = computedHash.split('$')[3];
    
    return computedHashPart === hash;
  } catch (error) {
    return false;
  }
}

function generateToken(userId: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { 
    sub: userId, 
    exp: Date.now() + TOKEN_EXPIRE_HOURS * 60 * 60 * 1000,
    iat: Date.now() 
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const signature = btoa(encodedHeader + encodedPayload + SECRET_KEY).slice(0, 43);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token: string): { userId: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp < Date.now()) {
      return null;
    }
    
    const expectedSig = btoa(parts[0] + parts[1] + SECRET_KEY).slice(0, 43);
    if (parts[2] !== expectedSig) {
      return null;
    }
    
    return { userId: payload.sub, exp: payload.exp };
  } catch (error) {
    return null;
  }
}

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new ConvexError("Email already registered");
    }

    const passwordHash = await hashPassword(args.password);
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      name: args.name,
      role: "player",
      isVerified: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId,
      action: "signup",
      detailsJson: JSON.stringify({ email: args.email }),
      createdAt: Date.now(),
    });

    const token = generateToken(userId);

    return {
      message: "User created successfully",
      access_token: token,
      token_type: "bearer",
      userId,
    };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new ConvexError("Incorrect email or password");
    }

    const isValid = await verifyPassword(args.password, user.passwordHash);
    if (!isValid) {
      throw new ConvexError("Incorrect email or password");
    }

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "login",
      detailsJson: JSON.stringify({ email: args.email }),
      createdAt: Date.now(),
    });

    const token = generateToken(user._id);

    return {
      access_token: token,
      token_type: "bearer",
      userId: user._id,
    };
  },
});

export const getMe = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  },
});
