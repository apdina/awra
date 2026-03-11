import { NextResponse } from 'next/server';

/**
 * Debug endpoint to verify time consistency between backend and frontend
 * 
 * Returns current time in multiple formats to verify timezone handling
 */
export async function GET() {
  const now = new Date();
  
  return NextResponse.json({
    // Server information
    server: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: now.getTimezoneOffset(), // Minutes from UTC (0 = UTC)
    },
    
    // Current time in different formats
    current_time: {
      // Local time
      local: {
        full: now.toString(),
        iso: now.toISOString(),
        date: now.toLocaleDateString('en-GB'),
        time: now.toLocaleTimeString('en-GB', { hour12: false }),
        day_of_week: now.getDay(), // 0 = Sunday
        day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
      },
      
      // UTC time
      utc: {
        iso: now.toISOString(),
        date: `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`,
        time: `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
        day_of_week: now.getUTCDay(), // 0 = Sunday
        day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getUTCDay()],
      },
      
      // Timestamp
      timestamp: now.getTime(),
    },
    
    // Draw time calculation
    draw_calculation: {
      is_sunday_local: now.getDay() === 0,
      is_sunday_utc: now.getUTCDay() === 0,
      should_skip_to_monday: now.getUTCDay() === 0,
    },
    
    // Verification
    verification: {
      is_utc: now.getTimezoneOffset() === 0,
      local_matches_utc: now.getDay() === now.getUTCDay() && 
                         now.getHours() === now.getUTCHours(),
    }
  });
}
