/**
 * Status translation utilities
 * Maps database status values to i18n translation keys
 */

export type TicketStatus = 'active' | 'won' | 'no_winning' | 'claimed' | 'cancelled';

/**
 * Get the i18n translation key for a ticket status
 * @param status - Status value from database (can be uppercase or lowercase)
 * @returns Translation key like 'tickets.won'
 */
export function getStatusTranslationKey(status: string | undefined): string {
  if (!status) return 'tickets.active';
  
  const statusLower = status.toLowerCase();
  
  // Map status values to translation keys
  const statusMap: Record<string, string> = {
    'active': 'tickets.active',
    'won': 'tickets.won',
    'no_winning': 'tickets.no_winning',
    'claimed': 'tickets.claimed',
    'cancelled': 'tickets.cancelled',
  };
  
  return statusMap[statusLower] || 'tickets.active';
}

/**
 * Get the CSS color classes for a ticket status badge
 * @param status - Status value from database (can be uppercase or lowercase)
 * @returns CSS color classes for styling
 */
export function getStatusColorClasses(status: string | undefined): string {
  if (!status) return 'bg-yellow-500/20 text-yellow-400';
  
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'won':
      return 'bg-green-500/20 text-green-400';
    case 'no_winning':
      return 'bg-gray-500/20 text-gray-400';
    case 'claimed':
      return 'bg-blue-500/20 text-blue-400';
    case 'cancelled':
      return 'bg-red-500/20 text-red-400';
    case 'active':
    default:
      return 'bg-yellow-500/20 text-yellow-400';
  }
}
