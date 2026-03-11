// Supabase stub for backward compatibility during Convex migration

export function createSupabaseServiceClient() {
  console.warn('⚠️ createSupabaseServiceClient() called - Supabase is disabled, returning mock data');
  
  // Return a mock Supabase client that returns fallback data
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        order: (column: string, options: any) => ({
          limit: (limit: number) => ({
            maybeSingle: () => Promise.resolve({
              data: null,
              error: null
            }),
            single: () => Promise.resolve({
              data: null,
              error: null
            })
          }),
          range: (start: number, end: number) => Promise.resolve({
            data: [],
            error: null,
            count: 0
          })
        }),
        eq: (column: string, value: any) => ({
          order: (column: string, options: any) => Promise.resolve({
            data: [],
            error: null
          })
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => Promise.reject(new Error('Supabase is disabled'))
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: () => Promise.reject(new Error('Supabase is disabled'))
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.reject(new Error('Supabase is disabled'))
      })
    })
  };
}

export function createSupabaseClient() {
  console.warn('⚠️ createSupabaseClient() called - Supabase is disabled, returning mock client');
  
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null })
    }
  };
}