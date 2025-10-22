'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

interface UsePlacesSearchInfiniteQueryParams {
  keyword: string;
  limit?: number;
}

export function usePlacesSearchInfiniteQuery({
  keyword,
  limit = 10,
}: UsePlacesSearchInfiniteQueryParams) {
  return useInfiniteQuery({
    queryKey: ['places', 'search', 'infinite', keyword, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get('/places/search', {
        params: {
          q: keyword,
          page: pageParam,
          limit,
        },
      });

      if (!data.ok) {
        throw new Error(data.error?.message ?? '검색 중 오류가 발생했습니다.');
      }

      return data.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: keyword.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
