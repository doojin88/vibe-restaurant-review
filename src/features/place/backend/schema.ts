import { z } from 'zod';

// 장소 기본 스키마
export const PlaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  category: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  created_at: z.string(),
});

export type Place = z.infer<typeof PlaceSchema>;

// 장소 상세 스키마 (평균 평점 포함)
export const PlaceDetailSchema = PlaceSchema.extend({
  averageRating: z.number(),
  reviewCount: z.number(),
});

export type PlaceDetail = z.infer<typeof PlaceDetailSchema>;

// 주변 장소 조회 요청 스키마
export const GetNearbyPlacesSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().optional().default(1000),
});

export type GetNearbyPlacesQuery = z.infer<typeof GetNearbyPlacesSchema>;

// 장소 검색 요청 스키마
export const SearchPlacesSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
});

export type SearchPlacesQuery = z.infer<typeof SearchPlacesSchema>;
