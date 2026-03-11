import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

/**
 * Get admin secret from Convex systemConfig with fallback to environment
 */
export async function getAdminSecret(): Promise<string> {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const adminSecret = await convex.query(api.systemConfig.getConfig, { key: "ADMIN_SECRET" });
    return adminSecret?.value as string || process.env.ADMIN_SECRET || '';
  } catch (error) {
    console.warn('Failed to get admin secret from Convex, falling back to env');
    return process.env.ADMIN_SECRET || '';
  }
}

/**
 * Get admin password from Convex systemConfig with fallback to environment
 */
export async function getAdminPassword(): Promise<string> {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const adminPassword = await convex.query(api.systemConfig.getConfig, { key: "ADMIN_PASSWORD" });
    return adminPassword?.value as string || process.env.ADMIN_PASSWORD || '';
  } catch (error) {
    console.warn('Failed to get admin password from Convex, falling back to env');
    return process.env.ADMIN_PASSWORD || '';
  }
}
