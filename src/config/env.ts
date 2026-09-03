/**
 * src/config/env.ts
 *
 * Central environment variable configuration.
 * Validates all required env vars at startup — the application will
 * crash with a descriptive error rather than fail silently later.
 */

import 'dotenv/config';

type NodeEnv = 'development' | 'production' | 'test';

interface EnvConfig {
  port: number;
  nodeEnv: NodeEnv;

  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };

  cors: {
    origin: string[];
  };

  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `[Config] Missing required environment variable: "${key}"\n` +
        `Please copy .env.example to .env and fill in all values.`,
    );
  }
  return value.trim();
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key]?.trim() ?? defaultValue;
}

function parseNodeEnv(): NodeEnv {
  const envVal = (process.env.NODE_ENV ?? process.env.VERCEL_ENV ?? '').trim().toLowerCase();
  if (envVal === 'production' || envVal === 'prod') return 'production';
  if (envVal === 'test') return 'test';
  return 'development';
}

function buildConfig(): EnvConfig {
  const rawOrigin = optionalEnv('CORS_ORIGIN', 'http://localhost:3000');
  const origins = rawOrigin.split(',').map((o) => o.trim()).filter(Boolean);

  return {
    port: parseInt(optionalEnv('PORT', '3000'), 10),
    nodeEnv: parseNodeEnv(),

    supabase: {
      url: requireEnv('SUPABASE_URL'),
      anonKey: requireEnv('SUPABASE_ANON_KEY'),
      serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    },

    cors: {
      origin: origins,
    },

    rateLimit: {
      windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
      maxRequests: parseInt(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    },
  };
}

export const env = buildConfig();
export type { EnvConfig };
