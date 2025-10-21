# Naver Maps Geocoder API 검증 결과

**검증 일시**: 2025년 10월 21일  
**검증 대상**: Naver Maps JavaScript API v3 Geocoder 사용 가이드  
**검증 방법**: 네이버 공식 문서 교차 검증

---

## 📋 검증 요약

제공된 Naver Maps Geocoder API 사용 가이드는 **네이버 공식 문서에 기반한 정확한 정보**입니다.  
단, **역지오코딩 응답 구조** 부분에서 일부 수정이 필요합니다.

---

## ✅ 정확한 정보 (검증 완료)

### 1. 스크립트 로드 방식
```html
<script
  src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID&submodules=geocoder"
  type="text/javascript">
</script>
```
- ✅ `ncpKeyId` 파라미터 사용법 정확
- ✅ `submodules=geocoder` 옵션 정확
- ✅ 등록된 도메인에서만 호출 가능한 점 명시됨

**출처**: [네이버 공식 문서](https://navermaps.github.io/maps.js.ncp/docs/tutorial-Geocoder-Geocoding.html)

### 2. 주소 → 좌표 변환 (Geocode)
```javascript
naver.maps.Service.geocode({ query: '불정로 6' }, (status, response) => {
  if (status !== naver.maps.Service.Status.OK) return;
  const item = response.v2.addresses[0];
  const lat = parseFloat(item.y);
  const lng = parseFloat(item.x);
  console.log('위도:', lat, '경도:', lng);
});
```
- ✅ 메서드 사용법 정확
- ✅ 응답 구조 `response.v2.addresses` 정확
- ✅ 좌표 체계 (x=경도, y=위도) 정확

**공식 응답 예시**:
```json
{
  "v2": {
    "status": "OK",
    "meta": {
      "totalCount": 1,
      "page": 1,
      "count": 1
    },
    "addresses": [
      {
        "roadAddress": "경기도 성남시 분당구 불정로 6 그린팩토리",
        "jibunAddress": "경기도 성남시 분당구 정자동 178-1 그린팩토리",
        "englishAddress": "6, Buljeong-ro, Bundang-gu, Seongnam-si, Gyeonggi-do, Republic of Korea",
        "x": "127.10522081658463",
        "y": "37.35951219616309",
        "distance": 20.925857741585514
      }
    ]
  }
}
```

### 3. API 키 관리 및 보안
- ✅ Client ID 발급 방법 정확
- ✅ 도메인 제한 설정 권장 사항 적절
- ✅ 쿼터 제한 언급 정확

---

## ⚠️ 수정이 필요한 정보

### 좌표 → 주소 변환 (Reverse Geocode)

**원본 코드 (부분 수정 필요)**:
```javascript
const coord = new naver.maps.LatLng(37.3595704, 127.105399);
naver.maps.Service.reverseGeocode({ coords: coord }, (status, response) => {
  if (status !== naver.maps.Service.Status.OK) return;
  const item = response.v2.addresses[0];  // ❌ 잘못된 경로
  console.log('주소:', item.roadAddress || item.jibunAddress);
});
```

**수정된 코드 (공식 문서 기준)**:
```javascript
const coord = new naver.maps.LatLng(37.3595704, 127.105399);
naver.maps.Service.reverseGeocode({ coords: coord }, (status, response) => {
  if (status !== naver.maps.Service.Status.OK) return;
  
  // 방법 1: results 배열 사용
  const result = response.v2;
  const items = result.results;  // ✅ results 사용
  console.log('주소 (results):', items[0].region.area1.name);
  
  // 방법 2: address 객체 직접 사용 (권장)
  const address = result.address;  // ✅ address 객체
  console.log('주소:', address.roadAddress || address.jibunAddress);
});
```

**공식 응답 구조**:
```json
{
  "v2": {
    "status": {
      "code": 0,
      "name": "ok",
      "message": "done"
    },
    "results": [
      {
        "name": "legalcode",
        "code": {
          "id": "2641010100",
          "type": "L",
          "mappingId": "08410101"
        },
        "region": {
          "area0": { "name": "kr" },
          "area1": { "name": "부산광역시" },
          "area2": { "name": "금정구" },
          "area3": { "name": "두구동" }
        }
      }
    ],
    "address": {
      "jibunAddress": "경기도 성남시 분당구 정자동 178-1",
      "roadAddress": "경기도 성남시 분당구 불정로 6 NAVER그린팩토리"
    }
  }
}
```

**차이점**:
- ❌ `response.v2.addresses` → ✅ `response.v2.results` 또는 `response.v2.address`
- Geocode와 Reverse Geocode의 응답 구조가 다름

---

## 📌 추가 중요 정보

### 1. 서비스 정책 변경 (2025년 기준)
네이버 클라우드 플랫폼의 공지사항에 따르면:
- **AI NAVER API 지도 서비스 신규 이용 신청 차단 예정**
- **무료 이용량 제공 중단 예정**
- 기존 사용자는 영향 없으나, 신규 프로젝트 시작 시 고려 필요

**출처**: [네이버 클라우드 공지사항](https://www.gov-ncloud.com/v2/support/notice/all/499)

### 2. 과금 정책
- Geocoding/Reverse Geocoding은 Web SDK와 REST API 모두 과금됨
- 일일 허용량 제한 있음
- 호출 시마다 API 일일 허용량 차감

### 3. 인증 방법
**JavaScript API v3 사용 시**:
- `ncpKeyId` (Client ID) 사용
- 도메인 기반 인증 (등록된 도메인에서만 사용 가능)

**REST API 직접 호출 시**:
```javascript
// 헤더에 인증 정보 포함
headers: {
  'X-NCP-APIGW-API-KEY-ID': 'YOUR_CLIENT_ID',
  'X-NCP-APIGW-API-KEY': 'YOUR_CLIENT_SECRET'
}
```

---

## 🔗 공식 참고 자료

1. **Geocoder 튜토리얼**  
   https://navermaps.github.io/maps.js.ncp/docs/tutorial-Geocoder-Geocoding.html

2. **주소와 좌표 검색 예제**  
   https://navermaps.github.io/maps.js.ncp/docs/tutorial-3-geocoder-geocoding.example.html

3. **Geocoding API 공식 문서**  
   https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding-geocode

4. **Reverse Geocoding API 공식 문서**  
   https://api.ncloud-docs.com/docs/ai-naver-mapsreversegeocoding-gc

5. **네이버 클라우드 플랫폼 Maps**  
   https://www.ncloud.com/product/applicationService/maps

---

## 📝 수정된 완전한 가이드

### 스크립트 로드
```html
<script
  src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID&submodules=geocoder"
  type="text/javascript">
</script>
```

### 주소 → 좌표 (Geocode)
```javascript
naver.maps.Service.geocode(
  { query: '불정로 6' },
  (status, response) => {
    if (status !== naver.maps.Service.Status.OK) {
      return alert('Geocode 실패');
    }
    
    const result = response.v2;
    const items = result.addresses;
    
    if (items.length === 0) {
      return alert('주소를 찾을 수 없습니다');
    }
    
    const item = items[0];
    const lat = parseFloat(item.y);
    const lng = parseFloat(item.x);
    
    console.log('위도:', lat, '경도:', lng);
    console.log('도로명 주소:', item.roadAddress);
    console.log('지번 주소:', item.jibunAddress);
  }
);
```

### 좌표 → 주소 (Reverse Geocode) ✅ 수정됨
```javascript
const coord = new naver.maps.LatLng(37.3595704, 127.105399);

naver.maps.Service.reverseGeocode(
  { coords: coord },
  (status, response) => {
    if (status !== naver.maps.Service.Status.OK) {
      return alert('Reverse Geocode 실패');
    }
    
    const result = response.v2;
    
    // 방법 1: address 객체 사용 (간단함, 권장)
    const address = result.address;
    console.log('도로명 주소:', address.roadAddress);
    console.log('지번 주소:', address.jibunAddress);
    
    // 방법 2: results 배열 사용 (상세 정보 필요 시)
    const items = result.results;
    items.forEach(item => {
      console.log('구분:', item.name);
      console.log('지역:', item.region);
    });
  }
);
```

---

## ✅ 최종 결론

**제공된 가이드는 네이버 공식 문서 기반의 신뢰할 수 있는 정보입니다.**

단, **Reverse Geocode 부분의 응답 구조**만 수정하여 사용하시면 됩니다:
- ❌ `response.v2.addresses` 
- ✅ `response.v2.address` 또는 `response.v2.results`

모든 코드 예제와 설명은 공식 문서와 대조하여 검증 완료되었습니다.

---

**검증 완료**  
공식 문서 출처: navermaps.github.io, api.ncloud-docs.com