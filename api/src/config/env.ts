import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DATABASE_URL: z.string(),
  DATABASE_ENCRYPTION_KEY: z.string().min(32),
  
  // Security
  MASTER_ENCRYPTION_KEY: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  
  // API Configuration
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.string().transform((val) => val === 'true').default('true'),
  
  // Feature Flags
  ENABLE_SWAGGER: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_AUDIT_LOGS: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_FIELD_ENCRYPTION: z.string().transform((val) => val === 'true').default('true'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
}

// Export validated config
export const config = validateEnv();