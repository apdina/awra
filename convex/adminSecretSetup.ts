import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Setup admin secrets in Convex systemConfig
 * This should be run once to migrate admin secrets from .env to Convex
 */
export const setupAdminSecrets = mutation({
  args: {
    adminSecret: v.string(),
    adminPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate that we're setting strong secrets
    if (args.adminSecret.length < 32) {
      throw new Error("Admin secret must be at least 32 characters long");
    }
    
    if (args.adminPassword.length < 12) {
      throw new Error("Admin password must be at least 12 characters long");
    }

    // Check if secrets already exist
    const existingSecret = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "ADMIN_SECRET"))
      .first();

    const existingPassword = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "ADMIN_PASSWORD"))
      .first();

    // Insert or update admin secret
    if (existingSecret) {
      await ctx.db.patch(existingSecret._id, {
        value: args.adminSecret,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemConfig", {
        key: "ADMIN_SECRET",
        value: args.adminSecret,
        description: "Secure admin secret for sensitive operations",
        updatedAt: Date.now(),
      });
    }

    // Insert or update admin password
    if (existingPassword) {
      await ctx.db.patch(existingPassword._id, {
        value: args.adminPassword,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemConfig", {
        key: "ADMIN_PASSWORD",
        value: args.adminPassword,
        description: "Admin password for authentication",
        updatedAt: Date.now(),
      });
    }

    console.log("✅ Admin secrets migrated to Convex successfully");
    return { success: true };
  },
});

/**
 * Generate secure admin secrets
 * Use this to generate new strong secrets for your admin system
 */
export const generateSecureAdminSecrets = mutation({
  handler: async (ctx) => {
    // Generate secure random secret (32 bytes)
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    const adminSecret = Array.from(secretBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate secure password (16 bytes, converted to readable characters)
    const passwordBytes = new Uint8Array(16);
    crypto.getRandomValues(passwordBytes);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const adminPassword = Array.from(passwordBytes)
      .map(b => chars[b % chars.length])
      .join('');

    return {
      adminSecret,
      adminPassword,
      instructions: {
        adminSecret: "Store this secret securely - it's used for sensitive operations",
        adminPassword: "Use this password for admin login authentication",
        nextStep: "Run setupAdminSecrets mutation with these values to store in Convex"
      }
    };
  },
});
