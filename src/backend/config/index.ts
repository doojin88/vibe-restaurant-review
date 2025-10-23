import { z } from 'zod';
import type { AppConfig } from '@/backend/hono/context';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_NAVER_CLIENT_ID: z.string().min(1),
  NEXT_PUBLIC_NAVER_CLIENT_SECRET: z.string().min(1),
  NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: z.string().min(1),
  NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET: z.string().min(1),
});

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_NAVER_CLIENT_ID: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
    NEXT_PUBLIC_NAVER_CLIENT_SECRET: process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET,
    NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID,
    NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET: process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend configuration: ${messages}`);
  }

  cachedConfig = {
    supabase: {
      url: parsed.data.SUPABASE_URL,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
    naver: {
      clientId: parsed.data.NEXT_PUBLIC_NAVER_CLIENT_ID,
      clientSecret: parsed.data.NEXT_PUBLIC_NAVER_CLIENT_SECRET,
    },
    naverMap: {
      clientId: parsed.data.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID,
      clientSecret: parsed.data.NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
