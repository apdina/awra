import { ConvexHttpClient } from 'convex/browser';

/**
 * Singleton Convex HTTP client for server-side API routes
 * Reusing the same client instance prevents connection overhead and improves performance
 */
let convexClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not set');
    }
    convexClient = new ConvexHttpClient(convexUrl);
  }
  return convexClient;
}
