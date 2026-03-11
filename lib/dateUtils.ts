/**
 * Date Utilities for AWRA Lottery
 *
 * Ensures consistent DD/MM/YYYY date formatting throughout the application
 */

/**
 * Format a date string to DD/MM/YYYY format
 * Accepts various input formats and converts to DD/MM/YYYY
 */
export function formatDateDDMMYYYY(dateInput: string | Date): string {
  let date: Date;

  if (typeof dateInput === 'string') {
    // Handle different input formats
    if (dateInput.includes('/')) {
      // Already in DD/MM/YYYY format
      return dateInput;
    } else if (dateInput.includes('-')) {
      // Convert YYYY-MM-DD to DD/MM/YYYY
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    // Try to parse as date string
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    // Invalid date
    return 'Invalid Date';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Get today's date in DD/MM/YYYY format
 */
export function getTodayDDMMYYYY(): string {
  return formatDateDDMMYYYY(new Date());
}

/**
 * Convert DD/MM/YYYY to Date object
 */
export function parseDDMMYYYY(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const date = new Date(year, month, day);
  return date;
}

/**
 * Format a date for display (human readable)
 * Uses DD/MM/YYYY format consistently
 */
export function formatDateForDisplay(dateInput: string | Date): string {
  return formatDateDDMMYYYY(dateInput);
}

/**
 * Get relative date description (Today, Yesterday, etc.)
 */
export function getRelativeDateDescription(dateStr: string): string {
  const date = parseDDMMYYYY(dateStr);
  if (!date) return dateStr;

  const today = new Date();
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (diffDays) {
    case 0: return 'Today';
    case -1: return 'Yesterday';
    case 1: return 'Tomorrow';
    default:
      return diffDays < 0
        ? `${Math.abs(diffDays)} days ago`
        : `In ${diffDays} days`;
  }
}

/**
 * Format date and time for display
 */
export function formatDateTimeForDisplay(dateStr: string, timeStr?: string): string {
  const formattedDate = formatDateDDMMYYYY(dateStr);
  if (timeStr) {
    return `${formattedDate} at ${timeStr}`;
  }
  return formattedDate;
}

/**
 * Format ISO date string for display
 * Handles ISO format like "2026-01-21T14:03:47.178472+00:00"
 */
export function formatISODateTimeForDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${hours}:${minutes}`;
    
    return `${formattedDate} at ${formattedTime}`;
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Get user-friendly date and time display
 * Always returns format: "DD/MM/YYYY  HH:MM"
 * Uses GMT+1 timezone for consistent display
 */
export function getUserFriendlyDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Convert to GMT+1 timezone
    const gmtPlus1Date = new Date(date.getTime() + (60 * 60 * 1000)); // Add 1 hour for GMT+1
    
    // Always show full date
    const day = String(gmtPlus1Date.getDate()).padStart(2, '0');
    const month = String(gmtPlus1Date.getMonth() + 1).padStart(2, '0');
    const year = gmtPlus1Date.getFullYear();
    
    // Get hours and minutes in GMT+1
    const hours = String(gmtPlus1Date.getHours()).padStart(2, '0');
    const minutes = String(gmtPlus1Date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year}  ${hours}:${minutes}`;
  } catch (error) {
    return 'Invalid Date';
  }
}