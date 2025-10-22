'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { type GetNearbyPlacesQuery } from '../lib/dto';

export function usePlacesNearbyQuery(
  location: { lat: number; lng: number } | null,
  radius: number = 1000
) {
  return useQuery({
    queryKey: ['places', 'nearby', location?.lat, location?.lng, radius],
    queryFn: async () => {
      if (!location) return { places: [] };

      const query: GetNearbyPlacesQuery = {
        lat: location.lat,
        lng: location.lng,
        radius,
      };

      const { data } = await apiClient.get('/places/nearby', {
        params: query,
      });

      if (!data.ok) {
        throw new Error(data.error?.message ?? '주변 장소 조회 실패');
      }

      return data.data;
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 5,
  });
}
