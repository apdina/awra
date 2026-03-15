// Data fetching API using Convex wrappers
import {
  getCurrentDrawHybrid,
  getWinningNumbersHybrid,
  getUserTicketsHybrid,
  type Draw,
} from './convex-data-fetching';

export type { Draw };

export async function getCurrentDraw(): Promise<Draw> {
  return getCurrentDrawHybrid();
}

export async function getWinningNumbers(limit: number = 50): Promise<Draw[]> {
  return getWinningNumbersHybrid(limit);
}

export async function getUserTickets(userId: string): Promise<any[]> {
  return getUserTicketsHybrid(userId);
}

export async function cachedApiCall<T>(
  endpoint: string,
  revalidateSeconds: number = 60
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
