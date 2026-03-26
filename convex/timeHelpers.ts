import { DatabaseReader } from "./_generated/server";

export const DEFAULT_TIMEZONE = "Africa/Casablanca";

/**
 * Get the configured app timezone from database
 */
export async function getAppTimezone(db: DatabaseReader | any): Promise<string> {
  const config = await db
    .query("systemConfig")
    .filter((q: any) => q.eq(q.field("key"), "app_timezone"))
    .first();
  
  return (config?.value as string) || DEFAULT_TIMEZONE;
}

/**
 * Returns date parts for a specific timezone with strict 0-23 hours
 */
export function getZonedDateTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
    weekday: 'long'
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  
  return {
    year: parseInt(getPart('year') || '0', 10),
    month: parseInt(getPart('month') || '0', 10),
    day: parseInt(getPart('day') || '0', 10),
    hour: parseInt(getPart('hour') || '0', 10),
    minute: parseInt(getPart('minute') || '0', 10),
    second: parseInt(getPart('second') || '0', 10),
    weekday: getPart('weekday') || '' // "Sunday", "Monday", etc.
  };
}

/**
 * Returns a UTC Date corresponding to the given local time in the target timezone.
 * Resolves DST issues automatically using offset math.
 */
export function createDateInTimezone(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  // Create rough estimate using UTC
  const estimate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  
  // Get offset at estimate
  const parts = getZonedDateTimeParts(estimate, timeZone);
  
  // Convert parts to UTC ms to find offset
  const partsMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const estimateMs = estimate.getTime();
  const offsetMs = partsMs - estimateMs;
  
  // Subtract offset to get true UTC time
  const exact = new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetMs);
  
  // Double check in case we crossed a DST boundary exactly at that time
  const exactParts = getZonedDateTimeParts(exact, timeZone);
  if (exactParts.hour !== hour || exactParts.minute !== minute) {
    // Second iteration for DST boundary
    const partsMs2 = Date.UTC(exactParts.year, exactParts.month - 1, exactParts.day, exactParts.hour, exactParts.minute);
    const estimateMs2 = exact.getTime();
    const offsetMs2 = partsMs2 - estimateMs2;
    return new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetMs2);
  }
  
  return exact;
}

/**
 * Format date explicitly into DD/MM/YYYY text for a given timezone
 */
export function formatToDateString(date: Date, timeZone: string): string {
    const parts = getZonedDateTimeParts(date, timeZone);
    const d = String(parts.day).padStart(2, '0');
    const m = String(parts.month).padStart(2, '0');
    return `${d}/${m}/${parts.year}`;
}
