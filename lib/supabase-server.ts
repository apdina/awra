// Supabase server stub for backward compatibility during Convex migration

export function createSupabaseServerClient(request?: any, response?: any) {
  console.warn('⚠️ createSupabaseServerClient() called - Supabase is disabled, using Convex instead');
  throw new Error('Supabase is disabled. Use Convex for server-side operations.');
}