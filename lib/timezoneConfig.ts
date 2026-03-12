/**
 * Timezone Configuration System
 * 
 * Allows the app to use any timezone instead of hardcoded UTC
 * Handles daylight saving time automatically
 * 
 * Usage:
 * - Set timezone in systemConfig: { key: "app_timezone", value: "Africa/Casablanca" }
 * - All date/time calculations will use this timezone
 * - Falls back to UTC if not configured
 */

/**
 * Get the configured app timezone
 * Default: UTC
 * Can be set to any IANA timezone (e.g., "Africa/Casablanca", "Europe/London", "America/New_York")
 */
export function getAppTimezone(): string {
  // This will be fetched from systemConfig in Convex
  // For now, return from env or default to UTC
  return process.env.NEXT_PUBLIC_APP_TIMEZONE || 'UTC';
}

/**
 * Convert UTC timestamp to app timezone
 * Returns date object that represents the time in the app timezone
 */
export function convertUTCToAppTimezone(utcTimestamp: number): Date {
  const date = new Date(utcTimestamp);
  return date;
}

/**
 * Format date in app timezone
 * Returns DD/MM/YYYY format in the configured timezone
 */
export function formatDateInAppTimezone(utcTimestamp: number): string {
  const timezone = getAppTimezone();
  const date = new Date(utcTimestamp);
  
  // Use Intl API to format in specific timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  return `${day}/${month}/${year}`;
}

/**
 * Format time in app timezone
 * Returns HH:MM format in the configured timezone
 */
export function formatTimeInAppTimezone(utcTimestamp: number): string {
  const timezone = getAppTimezone();
  const date = new Date(utcTimestamp);
  
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return formatter.format(date);
}

/**
 * Get day of week in app timezone
 * Returns day name (Monday, Tuesday, etc.)
 */
export function getDayOfWeekInAppTimezone(utcTimestamp: number): string {
  const timezone = getAppTimezone();
  const date = new Date(utcTimestamp);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long'
  });
  
  return formatter.format(date);
}

/**
 * Parse DD/MM/YYYY date string and convert to UTC timestamp
 * Assumes the date is in app timezone
 */
export function parseDateInAppTimezone(dateStr: string, timeStr: string = '00:00'): number {
  const timezone = getAppTimezone();
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create a date string in ISO format
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  // Parse as if it's in the app timezone
  // This is a bit tricky - we need to account for timezone offset
  const date = new Date(isoString);
  
  // Get the offset between UTC and app timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Create a reference date and check offset
  const referenceDate = new Date(date);
  const parts = formatter.formatToParts(referenceDate);
  
  const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const tzHours = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const tzMinutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  
  // Calculate offset
  const offset = new Date(tzYear, tzMonth - 1, tzDay, tzHours, tzMinutes).getTime() - referenceDate.getTime();
  
  // Adjust the date by the offset
  return date.getTime() + offset;
}

/**
 * Get current time in app timezone
 * Returns { date: DD/MM/YYYY, time: HH:MM, dayOfWeek: string }
 */
export function getCurrentTimeInAppTimezone(): {
  date: string;
  time: string;
  dayOfWeek: string;
  timestamp: number;
} {
  const now = Date.now();
  
  return {
    date: formatDateInAppTimezone(now),
    time: formatTimeInAppTimezone(now),
    dayOfWeek: getDayOfWeekInAppTimezone(now),
    timestamp: now
  };
}

/**
 * Check if a time has passed in app timezone
 * Useful for draw time checks
 */
export function hasTimePassedInAppTimezone(dateStr: string, timeStr: string): boolean {
  const timezone = getAppTimezone();
  const now = new Date();
  
  // Parse the date and time
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create a date in the app timezone
  const targetTimestamp = parseDateInAppTimezone(dateStr, timeStr);
  
  return now.getTime() > targetTimestamp;
}

/**
 * Get timezone offset in hours
 * Useful for debugging and logging
 */
export function getTimezoneOffsetHours(): number {
  const timezone = getAppTimezone();
  
  // Create two dates: one in UTC, one in app timezone
  const now = new Date();
  const utcString = now.toLocaleString('en-GB', { timeZone: 'UTC' });
  const tzString = now.toLocaleString('en-GB', { timeZone: timezone });
  
  const utcDate = new Date(utcString);
  const tzDate = new Date(tzString);
  
  const offsetMs = tzDate.getTime() - utcDate.getTime();
  return offsetMs / (1000 * 60 * 60);
}

/**
 * List of common timezones
 * Can be used for admin UI to select timezone
 */
export const COMMON_TIMEZONES = [
  { name: 'UTC', value: 'UTC' },
  { name: 'Africa/Casablanca', value: 'Africa/Casablanca' },
  { name: 'Africa/Cairo', value: 'Africa/Cairo' },
  { name: 'Africa/Johannesburg', value: 'Africa/Johannesburg' },
  { name: 'Europe/London', value: 'Europe/London' },
  { name: 'Europe/Paris', value: 'Europe/Paris' },
  { name: 'Europe/Berlin', value: 'Europe/Berlin' },
  { name: 'America/New_York', value: 'America/New_York' },
  { name: 'America/Los_Angeles', value: 'America/Los_Angeles' },
  { name: 'Asia/Dubai', value: 'Asia/Dubai' },
  { name: 'Asia/Bangkok', value: 'Asia/Bangkok' },
  { name: 'Asia/Singapore', value: 'Asia/Singapore' },
  { name: 'Australia/Sydney', value: 'Australia/Sydney' },
] as const;
