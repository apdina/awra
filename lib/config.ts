import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Supabase disabled - migrated to Convex
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default(
    process.env.NODE_ENV === 'production' ? 'error' : 'info'
  ),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

// Cache the config to prevent repeated parsing
let cachedConfig: z.infer<typeof envSchema> | null = null;

function getConfig(): z.infer<typeof envSchema> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    cachedConfig = envSchema.parse(process.env);
    
    // Only log in development and only once
    if (process.env.NODE_ENV === 'development') {
      console.log('Config loaded successfully:', {
        nodeEnv: cachedConfig.NODE_ENV,
        logLevel: cachedConfig.LOG_LEVEL,
      });
    }
  } catch (error) {
    console.error('Config parsing error:', error);
    // In development, use defaults if env vars are missing
    if (process.env.NODE_ENV === 'development') {
      cachedConfig = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        LOG_LEVEL: 'debug',
        RATE_LIMIT_WINDOW_MS: 900000,
        RATE_LIMIT_MAX_REQUESTS: 100,
      } as z.infer<typeof envSchema>;
    } else {
      throw error;
    }
  }

  return cachedConfig!;
}

export { getConfig as config };
export type Config = z.infer<typeof envSchema>;
