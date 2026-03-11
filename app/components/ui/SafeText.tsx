"use client";

import React from 'react';
import { sanitizeText } from '@/lib/sanitize';

interface SafeTextProps {
  content: string | null | undefined;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * React component for safely displaying user-generated content
 * Automatically sanitizes text to prevent XSS attacks
 */
export function SafeText({ content, className = '', as: Component = 'span' }: SafeTextProps) {
  const sanitized = sanitizeText(content);
  
  return React.createElement(Component, { className }, sanitized);
}

/**
 * Component for displaying user names safely
 */
export function SafeUsername({ username, className = '' }: { username: string | null | undefined; className?: string }) {
  const sanitized = username
    ?.replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^a-zA-Z0-9_\- ]/g, '') // Allow only safe characters
    .trim()
    .substring(0, 50) || 'Anonymous';
  
  return <span className={className}>{sanitized}</span>;
}

/**
 * Component for displaying emails safely (masked for privacy)
 */
export function SafeEmail({ email, className = '' }: { email: string | null | undefined; className?: string }) {
  if (!email) return <span className={className}>No email</span>;
  
  // Show only first 2 characters and domain for privacy
  const [username, domain] = email.split('@');
  if (!domain) return <span className={className}>Invalid email</span>;
  
  const maskedUsername = username.length > 2 
    ? username.substring(0, 2) + '***' 
    : username;
  
  return <span className={className}>{`${maskedUsername}@${domain}`}</span>;
}
