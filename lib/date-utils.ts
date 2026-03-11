// Date formatting utilities for consistent date display across the app

export const formatDate = (dateString: string | Date, options?: {
  includeTime?: boolean;
  locale?: string;
  format?: 'short' | 'long' | 'numeric';
}) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const {
    includeTime = false,
    locale = 'en-GB', // Default to dd/mm/yyyy format
    format = 'short'
  } = options || {};

  const baseOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  if (includeTime) {
    baseOptions.hour = '2-digit';
    baseOptions.minute = '2-digit';
    baseOptions.hour12 = false; // Use 24-hour format
  }

  switch (format) {
    case 'long':
      baseOptions.month = 'long';
      break;
    case 'numeric':
      baseOptions.month = 'numeric';
      break;
    default:
      baseOptions.month = '2-digit';
  }

  return date.toLocaleDateString(locale, baseOptions);
};

// For database storage (ISO format)
export const formatDateForDB = (date: Date): string => {
  return date.toISOString();
};

// For display in chat (short format)
export const formatChatDate = (dateString: string | Date): string => {
  return formatDate(dateString, {
    includeTime: true,
    format: 'short'
  });
};

// For display in forms/tables
export const formatTableDate = (dateString: string | Date): string => {
  return formatDate(dateString, {
    includeTime: false,
    format: 'short'
  });
};
