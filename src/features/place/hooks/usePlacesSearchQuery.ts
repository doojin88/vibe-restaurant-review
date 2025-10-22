'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { type SearchPlacesQuery } from '../lib/dto';

export function usePlacesSearchQuery(query: SearchPlacesQuery) {
  return useQuery({
    queryKey: ['places', 'search', query],
    queryFn: async () => {
      const { data } = await apiClient.get('/places/search', {
        params: query,
      });

      if (!data.ok) {
        throw new Error(data.error?.message ?? '검색 중 오류가 발생했습니다.');
      }

      return data.data;
    },
    enabled: query.q.trim().length > 0,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
