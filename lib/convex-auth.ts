import { ConvexHttpClient } from "convex/browser";
import { NextRequest } from "next/server";

function getConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return url;
}

/**
 * Creates a Convex HTTP client for server-side use
 * This function provides a server-side Convex client that can be used
 * in API routes and server components
 */
export async function getServerConvexClient(request?: NextRequest): Promise<ConvexHttpClient> {
  const convexUrl = getConvexUrl();
  const client = new ConvexHttpClient(convexUrl);
  
  // If we have a request, this helper can later be extended to add request-scoped auth
  if (request) {
    // No authentication token extraction is required for current server-side Convex client usage
  }
  
  return client;
}
