# 네이버 지역 검색 API 가이드

## 개요

네이버 지역 검색 API는 네이버 지역 서비스에 등록된 업체 및 기관을 검색할 수 있는 RESTful API입니다. 검색 결과를 XML 또는 JSON 형식으로 반환하며, 하루 호출 한도는 25,000회입니다.

## 사전 준비 사항

1. 네이버 개발자 센터에서 애플리케이션 등록
2. 클라이언트 아이디와 클라이언트 시크릿 발급
3. API 권한 설정에서 "검색" 선택

## 기본 개념

- 네이버에서 장소를 검색하려면:

    1. **네이버 개발자 센터**에서 앱을 등록
    2. **Client ID**와 **Client Secret** 발급
    3. API 호출 시 인증 헤더 포함

- **환경 변수 설정**

    ```bash
    # .env.local
    NEXT_PUBLIC_NAVER_CLIENT_ID=your-client-id
    NEXT_PUBLIC_NAVER_CLIENT_SECRET=your-client-secret
    ```

## API 엔드포인트

### 요청 URL
- **JSON 형식**: `https://openapi.naver.com/v1/search/local.json`

### HTTP 메서드
GET

### 프로토콜
HTTPS

## 요청 파라미터

| 파라미터 | 타입 | 필수 여부 | 설명 |
|---------|------|----------|------|
| query | String | Y | 검색어 |
| display | Integer | N | 한 번에 표시할 검색 결과 개수 (기본값: 1, 최댓값: 5) |
| start | Integer | N | 검색 시작 위치 (기본값: 1, 최댓값: 1) |
| sort | String | N | 검색 결과 정렬 방법<br/>- `random`: 정확도순으로 내림차순 정렬 (기본값)<br/>- `comment`: 업체 및 기관에 대한 카페, 블로그의 리뷰 개수순으로 내림차순 정렬 |

## 인증

HTTP 요청 헤더에 다음 정보를 포함해야 합니다:

```http
X-Naver-Client-Id: {클라이언트 아이디}
X-Naver-Client-Secret: {클라이언트 시크릿}
```

## 요청 예시

```bash
curl "https://openapi.naver.com/v1/search/local.json?query=갈비집&display=10&start=1&sort=random" \
    -H "X-Naver-Client-Id: {클라이언트 아이디}" \
    -H "X-Naver-Client-Secret: {클라이언트 시크릿}"
```

## 응답 형식

### JSON 응답 구조

```json
{
    "rss": "2.0",
    "channel": {
        "title": "Naver Open API - local ::'검색어'",
        "link": "http://search.naver.com",
        "description": "Naver Search Result",
        "lastBuildDate": "검색 결과 생성 시간",
        "total": "총 검색 결과 개수",
        "start": "검색 시작 위치",
        "display": "한 번에 표시할 검색 결과 개수",
        "items": [
            {
                "title": "업체/기관 이름",
                "link": "상세 정보 URL",
                "category": "분류 정보",
                "description": "설명",
                "telephone": "전화번호",
                "address": "지번 주소",
                "roadAddress": "도로명 주소",
                "mapx": "X 좌표 (WGS84)",
                "mapy": "Y 좌표 (WGS84)"
            }
        ]
    }
}
```

## 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| title | String | 업체, 기관의 이름 |
| link | String | 업체, 기관의 상세 정보 URL |
| category | String | 업체, 기관의 분류 정보 |
| description | String | 업체, 기관에 대한 설명 |
| telephone | String | 전화번호 (하위 호환성을 위해 존재하지만 값을 반환하지 않음) |
| address | String | 업체, 기관의 지번 주소 |
| roadAddress | String | 업체, 기관의 도로명 주소 |
| mapx | Integer | 업체, 기관이 위치한 장소의 X 좌표 (WGS84 좌표계) |
| mapy | Integer | 업체, 기관이 위치한 장소의 Y 좌표 (WGS84 좌표계) |

## 오류 코드

| 오류 코드 | HTTP 상태 코드 | 오류 메시지 | 설명 |
|----------|---------------|-------------|------|
| SE01 | 400 | Incorrect query request (잘못된 쿼리요청입니다.) | API 요청 URL의 프로토콜, 파라미터 등에 오류가 있는지 확인 |
| SE02 | 400 | Invalid display value (부적절한 display 값입니다.) | display 파라미터의 값이 허용 범위(1~100)인지 확인 |
| SE03 | 400 | Invalid start value (부적절한 start 값입니다.) | start 파라미터의 값이 허용 범위(1~1000)인지 확인 |
| SE04 | 400 | Invalid sort value (부적절한 sort 값입니다.) | sort 파라미터의 값에 오타가 있는지 확인 |
| SE05 | 404 | Invalid search api (존재하지 않는 검색 api 입니다.) | API 요청 URL에 오타가 있는지 확인 |
| SE06 | 400 | Malformed encoding (잘못된 형식의 인코딩입니다.) | 검색어를 UTF-8로 인코딩 |
| SE99 | 500 | System Error (시스템 에러) | 서버 내부 오류 발생 |

## 주의사항

1. **403 오류**: 개발자 센터에서 검색 API 사용 설정이 되어 있지 않으면 발생할 수 있습니다.
2. **인코딩**: 검색어는 UTF-8로 인코딩해야 합니다.
3. **호출 한도**: 하루 25,000회 제한이 있습니다.
4. **좌표계**: mapx, mapy는 WGS84 좌표계를 사용합니다.

## 참고 자료

- [네이버 개발자 센터 - 지역 검색 API](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [API 공통 가이드](https://developers.naver.com/docs/common/openapiguide/)
- [개발자 포럼](https://developers.naver.com/forum)

