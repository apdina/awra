/**
 * Convex Cron Jobs
 * 
 * ⏰ TIME CRITICAL CODE
 * 
 * Scheduled tasks that run automatically
 * 
 * Time Format: HH:MM 24-hour (e.g., "21:40", "22:00")
 * Timezone: UTC
 * 
 * ⚠️ IMPORTANT: Cron jobs are dynamic!
 * - They read draw time from database every minute
 * - Admin can change draw time without redeploying code
 * - Cache invalidates automatically at the configured time
 * 
 * ⚠️ DO NOT hardcode draw times in cron schedules
 * ⚠️ ALWAYS read from systemConfig.default_draw_time
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();



/**
 * Ensure there's always an upcoming draw scheduled
 * Creates next draw if needed (skipping Sundays and holidays)
 */
crons.interval(
  "ensure-upcoming-draw",
  { hours: 6 }, // Run every 6 hours
  internal.scheduledDrawUpdates.ensureUpcomingDraw
);

export default crons;
