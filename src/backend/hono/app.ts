import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerPlaceRoutes } from '@/features/place/backend/route';
import { registerReviewRoutes } from '@/features/review/backend/route';
import type { AppEnv } from '@/backend/hono/context';

export const createHonoApp = () => {
  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  // 테스트 엔드포인트 추가
  app.get('/test', (c) => {
    return c.json({ message: 'Hono app is working!' });
  });

  registerExampleRoutes(app);
  registerPlaceRoutes(app);
  registerReviewRoutes(app);

  return app;
};
