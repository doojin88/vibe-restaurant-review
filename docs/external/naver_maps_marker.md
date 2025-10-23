# 네이버 지역 검색 API 활용 가이드

네이버 지역 검색 API를 활용하여 장소를 검색하고 지도에 표시하는 방법을 설명합니다.

## 1. 기본 개념


1.1 네이버에서 장소를 검색하려면:

1. **네이버 개발자 센터**에서 앱을 등록
2. **Client ID**와 **Client Secret** 발급
3. API 호출 시 인증 헤더 포함

1.2 **환경 변수 설정**

```bash
# .env.local
NEXT_PUBLIC_NAVER_CLIENT_ID=your-client-id
NEXT_PUBLIC_NAVER_CLIENT_SECRET=your-client-secret
```

1.3 API 엔드포인트

- 요청 URL
```
GET https://openapi.naver.com/v1/search/local.json?query={검색어}&display=5&start=1&sort=random
```

- 필수 헤더
```
X-Naver-Client-Id: {발급받은 your-client-id}
X-Naver-Client-Secret: {발급받은 your-client-secret}
```

- 응답 데이터
   - 장소 이름, 주소, 전화번호, 카테고리
   - 위도(`mapy`), 경도(`mapx`) 좌표 정보

## 2. 장소 검색 후 마커 표시 

1. **환경 변수 설정**

   ```bash
   # .env.local
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your-client-id
   ```

2. API request CLIENT ID 설정 

   ```
   ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}
   ```
3. 네이버 지도에 마커 표시 활용  

   ```js
      const location = new naver.maps.LatLng(mapy, mapx);
      new naver.maps.Marker({ position: location, map: map });
   ```

## 3. 참고 자료

- [네이버 지역 검색 API 공식 문서](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [네이버 지도 API v3 가이드](https://navermaps.github.io/maps.js.ncp/docs/tutorial-3-geocoder-geocoding.example.html)

