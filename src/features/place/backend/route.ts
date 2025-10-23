import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { PlaceService } from './service';
import { GetNearbyPlacesSchema, SearchPlacesSchema } from './schema';
import type { AppEnv } from '@/backend/hono/context';

export function registerPlaceRoutes(app: Hono<AppEnv>) {
  const placeRouter = new Hono<AppEnv>();

  // GET /api/places/nearby?lat={lat}&lng={lng}&radius={radius}
  placeRouter.get(
    '/nearby',
    zValidator('query', GetNearbyPlacesSchema),
    async (c) => {
      const query = c.req.valid('query');
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      logger.info('Fetching nearby places:', query);

      const result = await PlaceService.getNearbyPlaces(supabase, query);

      if (!result.ok) {
        return c.json({ ok: false, error: (result as any).error }, result.status);
      }

      return c.json({ ok: true, data: result.data }, result.status);
    }
  );

  // GET /api/places/search?q={keyword}&page={page}&limit={limit}
  placeRouter.get(
    '/search',
    zValidator('query', SearchPlacesSchema),
    async (c) => {
      const query = c.req.valid('query');
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      logger.info('Searching places with query:', query);

      const config = c.get('config');
      const result = await PlaceService.searchPlaces(supabase, query, config);

      if (!result.ok) {
        return c.json({ ok: false, error: (result as any).error }, result.status);
      }

      return c.json({ ok: true, data: result.data }, result.status);
    }
  );

  // GET /api/places/:id
  placeRouter.get('/:id', async (c) => {
    const placeId = c.req.param('id');
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    logger.info('Fetching place detail:', placeId);

    const result = await PlaceService.getPlaceById(supabase, placeId);

    if (!result.ok) {
      return c.json({ ok: false, error: (result as any).error }, result.status);
    }

    return c.json({ ok: true, data: result.data }, result.status);
  });

  app.route('/api/places', placeRouter);
}
