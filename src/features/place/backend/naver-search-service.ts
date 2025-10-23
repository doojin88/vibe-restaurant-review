import { success, failure } from '@/backend/http/response';

export interface NaverSearchResult {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

export interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverSearchResult[];
}

export class NaverSearchService {
  private static readonly BASE_URL = 'https://openapi.naver.com/v1/search/local.json';
  
  /**
   * 네이버 지역 검색 API 호출
   */
  static async searchPlaces(
    query: string,
    display: number = 10,
    start: number = 1,
    sort: 'random' | 'comment' = 'random',
    config?: { clientId: string; clientSecret: string }
  ) {
    try {
      const clientId = config?.clientId || process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
      const clientSecret = config?.clientSecret || process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

      // 디버깅: 환경 변수 확인 (서버 사이드)
      console.log('🔧 [SERVER] 환경 변수 확인:');
      console.log('process.env.NEXT_PUBLIC_NAVER_CLIENT_ID:', process.env.NEXT_PUBLIC_NAVER_CLIENT_ID);
      console.log('process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET:', process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET ? '설정됨' : '설정되지 않음');
      console.log('config?.clientId:', config?.clientId);
      console.log('config?.clientSecret:', config?.clientSecret ? '설정됨' : '설정되지 않음');

      if (!clientId || !clientSecret) {
        console.error('❌ 네이버 API 설정 누락:');
        console.error('Client ID:', clientId ? '설정됨' : '누락');
        console.error('Client Secret:', clientSecret ? '설정됨' : '누락');
        return failure(500, 'NAVER_API_CONFIG_MISSING', '네이버 API 설정이 누락되었습니다.');
      }

      const searchParams = new URLSearchParams({
        query: query.trim(),
        display: display.toString(),
        start: start.toString(),
        sort,
      });

      const requestUrl = `${this.BASE_URL}?${searchParams}`;
      
      // 디버깅: 요청 정보 출력 (서버 사이드)
      console.log('🔍 [SERVER] 네이버 지역 검색 API 호출:');
      console.log('URL:', requestUrl);
      console.log('Query:', query.trim());
      console.log('Display:', display);
      console.log('Start:', start);
      console.log('Sort:', sort);
      console.log('Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'undefined');

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
          'Content-Type': 'application/json',
        },
      });

      // 디버깅: 응답 상태 출력 (서버 사이드)
      console.log('📡 [SERVER] 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 네이버 API 오류:', response.status, errorText);
        return failure(500, 'NAVER_API_ERROR', '네이버 검색 API 호출에 실패했습니다.');
      }

      const data: NaverSearchResponse = await response.json();
      
      // 디버깅: 원본 응답 데이터 출력 (서버 사이드)
      console.log('📋 [SERVER] 네이버 API 원본 응답:');
      console.log(JSON.stringify(data, null, 2));
      console.log('📊 [SERVER] 응답 구조 분석:');
      console.log('- total:', data.total);
      console.log('- start:', data.start);
      console.log('- display:', data.display);
      console.log('- items length:', data.items?.length);
      console.log('- items type:', typeof data.items);
      console.log('- items is array:', Array.isArray(data.items));
      
      // items 배열 검증
      if (!data.items || !Array.isArray(data.items)) {
        console.error('❌ [SERVER] items가 배열이 아닙니다:', data.items);
        return failure(500, 'NAVER_API_INVALID_RESPONSE', '네이버 API 응답 형식이 올바르지 않습니다.');
      }
      
      // 네이버 API 응답을 내부 형식으로 변환
      const places = data.items.map((item, index) => {
        console.log(`🔍 [SERVER] 아이템 ${index} 처리:`, {
          title: item.title,
          mapx: item.mapx,
          mapy: item.mapy,
          roadAddress: item.roadAddress,
          address: item.address
        });
        
        const latitude = parseFloat(item.mapy) / 1000000;
        const longitude = parseFloat(item.mapx) / 1000000;
        
        console.log(`📍 [SERVER] 좌표 변환 ${index}:`, {
          original: { mapx: item.mapx, mapy: item.mapy },
          converted: { latitude, longitude },
          isValid: !isNaN(latitude) && !isNaN(longitude)
        });
        
        // 고유 ID 생성 (제목과 좌표를 조합하여 중복 방지)
        const uniqueId = `naver_${item.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${item.mapx}_${item.mapy}_${index}`;
        
        console.log(`🆔 [SERVER] ID 생성 ${index}:`, {
          originalTitle: item.title,
          cleanedTitle: item.title.replace(/[^a-zA-Z0-9가-힣]/g, '_'),
          mapx: item.mapx,
          mapy: item.mapy,
          index,
          uniqueId
        });
        
        return {
          id: uniqueId,
          name: item.title,
          address: item.roadAddress || item.address,
          category: item.category,
          description: item.description,
          telephone: item.telephone,
          link: item.link,
          latitude,
          longitude,
          source: 'naver' as const,
        };
      });

      // 디버깅: 변환된 데이터 출력 (서버 사이드)
      console.log('🔄 [SERVER] 변환된 장소 데이터:');
      console.log(JSON.stringify(places, null, 2));

      return success({
        places,
        total: data.total,
        hasMore: places.length === display,
      });

    } catch (error) {
      console.error('Naver search error:', error);
      return failure(500, 'NAVER_SEARCH_ERROR', '장소 검색 중 오류가 발생했습니다.');
    }
  }

  /**
   * 네이버 검색 결과를 Supabase places 형식으로 변환
   */
  static transformNaverResultToPlace(naverItem: NaverSearchResult, index: number = 0) {
    const uniqueId = `naver_${naverItem.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${naverItem.mapx}_${naverItem.mapy}_${index}`;
    
    return {
      id: uniqueId,
      name: naverItem.title,
      address: naverItem.roadAddress || naverItem.address,
      category: naverItem.category,
      description: naverItem.description,
      telephone: naverItem.telephone,
      link: naverItem.link,
      latitude: parseFloat(naverItem.mapy) / 1000000,
      longitude: parseFloat(naverItem.mapx) / 1000000,
      source: 'naver' as const,
    };
  }
}
