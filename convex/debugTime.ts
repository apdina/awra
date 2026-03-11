/**
 * Debug functions to verify Convex timezone and time handling
 * 
 * Use these to ensure Convex is using UTC consistently
 */

import { query } from "./_generated/server";

/**
 * Check Convex server timezone and time
 * Call this to verify Convex is using UTC
 */
export const checkConvexTime = query({
  handler: async (ctx) => {
    const now = new Date();
    const timestamp = Date.now();
    
    return {
      // Convex server information
      convex_server: {
        note: "Convex always runs in UTC timezone",
        timestamp: timestamp,
      },
      
      // Current time in different formats
      current_time: {
        // Local time (should be UTC on Convex)
        local: {
          full: now.toString(),
          iso: now.toISOString(),
          date: `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`,
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          day_of_week: now.getDay(), // 0 = Sunday
          day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
        },
        
        // UTC time (explicit)
        utc: {
          iso: now.toISOString(),
          date: `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`,
          time: `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
          day_of_week: now.getUTCDay(), // 0 = Sunday
          day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getUTCDay()],
        },
      },
      
      // Draw time calculation (what getOrCreateCurrentDraw uses)
      draw_calculation: {
        using_utc_methods: {
          is_sunday: now.getUTCDay() === 0,
          should_skip_to_monday: now.getUTCDay() === 0,
          current_utc_date: `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`,
          current_utc_time: `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
        },
        using_local_methods: {
          is_sunday: now.getDay() === 0,
          should_skip_to_monday: now.getDay() === 0,
          current_local_date: `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`,
          current_local_time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        },
      },
      
      // Verification
      verification: {
        local_matches_utc: now.getDay() === now.getUTCDay() && 
                           now.getHours() === now.getUTCHours() &&
                           now.getDate() === now.getUTCDate(),
        timezone_offset_minutes: now.getTimezoneOffset(), // Should be 0 for UTC
        is_utc: now.getTimezoneOffset() === 0,
      },
      
      // What getOrCreateCurrentDraw would return
      simulated_draw: {
        note: "This simulates what getOrCreateCurrentDraw calculates",
        is_sunday_utc: now.getUTCDay() === 0,
        next_draw_date: calculateNextDrawDate(now),
      }
    };
  },
});

/**
 * Helper function to simulate draw date calculation
 */
function calculateNextDrawDate(now: Date): string {
  let nextDrawDate = new Date(now);
  const drawTime = "21:40";
  const [hours, minutes] = drawTime.split(':').map(Number);
  
  // Set to draw time (UTC)
  nextDrawDate.setUTCHours(hours, minutes, 0, 0);
  
  // If today is Sunday (UTC), skip to Monday
  if (nextDrawDate.getUTCDay() === 0) {
    nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
  }
  
  // If draw time has passed (UTC), move to next day
  if (nextDrawDate.getTime() <= now.getTime()) {
    nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
    
    // Check again if new day is Sunday (UTC)
    if (nextDrawDate.getUTCDay() === 0) {
      nextDrawDate.setUTCDate(nextDrawDate.getUTCDate() + 1);
    }
  }
  
  // Format as DD/MM/YYYY (UTC)
  const day = String(nextDrawDate.getUTCDate()).padStart(2, '0');
  const month = String(nextDrawDate.getUTCMonth() + 1).padStart(2, '0');
  const year = nextDrawDate.getUTCFullYear();
  
  return `${day}/${month}/${year} at ${drawTime} UTC`;
}
