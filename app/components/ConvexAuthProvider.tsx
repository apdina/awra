"use client";

/**
 * Convex Auth Provider
 * 
 * Wraps the app with Convex client (simple authentication)
 */

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

interface ConvexAuthProviderProps {
  children: ReactNode;
}

export function ConvexAuthProvider({ children }: ConvexAuthProviderProps) {
  // Create Convex client
  const convexClient = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }
    console.log("[Convex Provider] Creating client with URL:", url);
    return new ConvexReactClient(url);
  }, []);
  
  // Note: Using simple auth system that doesn't require Convex's built-in auth
  // Authentication is handled via simple_auth.ts mutations
  
  return (
    <ConvexProvider client={convexClient}>
      {children}
    </ConvexProvider>
  );
}
