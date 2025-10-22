import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { ReviewService } from './service';
import { CreateReviewSchema, GetReviewsSchema } from './schema';
import { z } from 'zod';

export function registerReviewRoutes(app: Hono<AppEnv>) {
  const router = new Hono<AppEnv>();

  // POST /api/places/:placeId/reviews
  router.post(
    '/:placeId/reviews',
    zValidator('param', z.object({ placeId: z.string().uuid() })),
    zValidator('json', CreateReviewSchema),
    async (c) => {
      const { placeId } = c.req.valid('param');
      const input = c.req.valid('json');
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      logger.info('Creating review for place:', placeId);

      const result = await ReviewService.createReview(supabase, placeId, input);

      if (!result.ok) {
        return c.json({ ok: false, error: (result as any).error }, result.status);
      }

      return c.json({ ok: true, data: result.data }, result.status);
    }
  );

  // GET /api/places/:placeId/reviews
  router.get(
    '/:placeId/reviews',
    zValidator('param', z.object({ placeId: z.string().uuid() })),
    zValidator('query', GetReviewsSchema),
    async (c) => {
      const { placeId } = c.req.valid('param');
      const query = c.req.valid('query');
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      logger.info('Fetching reviews for place:', placeId);

      const result = await ReviewService.getReviews(supabase, placeId, query);

      if (!result.ok) {
        return c.json({ ok: false, error: (result as any).error }, result.status);
      }

      return c.json({ ok: true, data: result.data }, result.status);
    }
  );

  app.route('/api/places', router);
}
