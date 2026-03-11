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
  
  // If we have a request, we could potentially extract auth tokens from cookies
  // and configure the client with authentication context here
  if (request) {
    // TODO: Extract auth token from cookies and configure client if needed
    // const token = request.cookies.get('auth_token')?.value;
    // if (token) {
    //   // Configure client with auth context
    // }
  }
  
  return client;
}
