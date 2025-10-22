'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { PlaceDetailSchema, type PlaceDetail } from '../lib/dto';

export function usePlaceQuery(placeId: string) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/places/${placeId}`);

      if (!data.ok) {
        throw new Error(data.error?.message ?? '장소 조회 실패');
      }

      return PlaceDetailSchema.parse(data.data.place);
    },
    enabled: !!placeId,
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('NOT_FOUND')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
