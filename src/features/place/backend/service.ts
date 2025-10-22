import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure } from '@/backend/http/response';
import { PlaceErrorCode } from './error';
import type { GetNearbyPlacesQuery, SearchPlacesQuery } from './schema';

export const PlaceService = {
  /**
   * 주변 장소 조회 (리뷰 존재 장소만)
   */
  async getNearbyPlaces(
    supabase: SupabaseClient,
    query: GetNearbyPlacesQuery
  ) {
    const { lat, lng, radius } = query;

    const latDelta = radius / 111000;
    const lngDelta = radius / (111000 * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    const { data, error } = await supabase
      .from('places')
      .select(`
        id,
        name,
        address,
        category,
        latitude,
        longitude,
        created_at
      `)
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .limit(100);

    if (error) {
      console.error('Nearby places query error:', error);
      return failure(500, PlaceErrorCode.FETCH_FAILED, '주변 장소 조회에 실패했습니다.');
    }

    if (!data) {
      return failure(500, PlaceErrorCode.FETCH_FAILED, '주변 장소 조회에 실패했습니다.');
    }

    const places = (data as unknown as Array<{
      id: string;
      name: string;
      address: string;
      category: string;
      latitude: number;
      longitude: number;
      created_at: string;
    }>).map((place) => ({
      id: place.id,
      name: place.name,
      address: place.address,
      category: place.category,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      created_at: place.created_at,
    }));

    return success({ places });
  },

  /**
   * 장소 상세 조회 (평균 평점 포함)
   */
  async getPlaceById(supabase: SupabaseClient, placeId: string) {
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      return failure(
        404,
        PlaceErrorCode.PLACE_NOT_FOUND,
        '장소를 찾을 수 없습니다.'
      );
    }

    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('place_id', placeId);

    if (reviewError) {
      return failure(
        500,
        PlaceErrorCode.FETCH_FAILED,
        '장소 정보 조회에 실패했습니다.'
      );
    }

    const reviewCount = reviews?.length ?? 0;
    const averageRating =
      reviewCount > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    const placeDetail = {
      id: place.id,
      name: place.name,
      address: place.address,
      category: place.category,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      created_at: place.created_at,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount,
    };

    return success({ place: placeDetail });
  },

  /**
   * 키워드로 장소 검색
   */
  async searchPlaces(supabase: SupabaseClient, query: SearchPlacesQuery) {
    const { q, page, limit } = query;
    const offset = (page - 1) * limit;

    const { count, error: countError } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .ilike('name', `%${q}%`);

    if (countError) {
      console.error('Count query error:', countError);
      return failure(500, PlaceErrorCode.SEARCH_FAILED, '검색 중 오류가 발생했습니다.');
    }

    const total = count ?? 0;

    const { data, error } = await supabase
      .from('places')
      .select('*')
      .ilike('name', `%${q}%`)
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Search query error:', error);
      return failure(500, PlaceErrorCode.SEARCH_FAILED, '검색 중 오류가 발생했습니다.');
    }

    if (!data) {
      return failure(500, PlaceErrorCode.FETCH_FAILED, '검색 결과 조회에 실패했습니다.');
    }

    const places = (data as unknown as Array<{
      id: string;
      name: string;
      address: string;
      category: string;
      latitude: number;
      longitude: number;
      created_at: string;
    }>).map((place) => ({
      id: place.id,
      name: place.name,
      address: place.address,
      category: place.category,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      created_at: place.created_at,
    }));

    const hasMore = total > offset + limit;

    return success({
      places,
      total,
      hasMore,
    });
  },
};
