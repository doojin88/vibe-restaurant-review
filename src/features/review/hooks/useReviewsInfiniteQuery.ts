'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { type Review } from '../lib/dto';

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  hasMore: boolean;
}

export function useReviewsInfiniteQuery(placeId: string, limit = 10) {
  return useInfiniteQuery({
    queryKey: ['reviews', placeId, 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get(`/places/${placeId}/reviews`, {
        params: { page: pageParam, limit },
      });

      if (!data.ok) {
        throw new Error(data.error?.message ?? '리뷰 조회 실패');
      }

      return data.data as ReviewsResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!placeId,
    staleTime: 1000 * 60 * 5,
  });
}
