import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateAdminSecret = mutation({
  args: {
    oldSecret: v.string(),
    newSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the old secret first
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "ADMIN_SECRET"))
      .first();
    
    console.log("Config found:", config);
    console.log("Old secret provided:", args.oldSecret);
    console.log("Stored value:", config?.value);
    
    if (!config || config.value !== args.oldSecret) {
      throw new Error("Invalid old admin secret");
    }
    
    // Update with the new secret
    await ctx.db.patch(config._id, {
      value: args.newSecret,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
