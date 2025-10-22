'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { type GetReviewsQuery } from '../lib/dto';

export function useReviewsQuery(placeId: string, query: GetReviewsQuery = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ['reviews', placeId, query],
    queryFn: async () => {
      const { data } = await apiClient.get(`/places/${placeId}/reviews`, {
        params: query,
      });

      if (!data.ok) {
        throw new Error(data.error?.message ?? '리뷰 조회 실패');
      }

      return data.data;
    },
    enabled: !!placeId,
    staleTime: 1000 * 60 * 5,
  });
}
