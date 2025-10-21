# 📍 네이버 지도 API - Next.js + TypeScript 마커 표시
이 문서는 네이버 지도 API를 **Next.js + TypeScript** 환경에서 사용하여 마커를 표시하는 예제입니다.

**최종 업데이트:** 2025년 10월 21일  
**검증된 버전:** Next.js 15 LTS, 네이버 지도 API v3

---

## 🧭 1. 코드 예시

```tsx
"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

export default function MapPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;
    script.async = true;
    script.onload = () => {
      if (window.naver) {
        const map = new window.naver.maps.Map("map", {
          center: new window.naver.maps.LatLng(37.3595704, 127.105399),
          zoom: 15,
        });
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(37.3595704, 127.105399),
          map: map,
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div
      id="map"
      style={{ width: "100%", height: "500px", borderRadius: "8px" }}
    />
  );
}
```

---

## ⚙️ 2. 환경 변수 설정

`.env.local` 파일에 클라이언트 ID를 저장합니다.

```env
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=여기에_네이버_클라이언트_ID
```

### 🔐 보안 관련 중요 사항

**주의:** `NEXT_PUBLIC_` 접두사를 사용하면 환경 변수가 **빌드 타임에 클라이언트 번들에 인라인되어 브라우저에 노출**됩니다.

- ✅ **네이버 지도 API 키는 공개 가능**: 도메인 제한 등의 보호 장치로 안전하게 관리됩니다
- ❌ **민감한 정보는 절대 사용 금지**: 데이터베이스 비밀번호, 서버 API 키 등은 `NEXT_PUBLIC_` 없이 서버 측에서만 사용

---

## 📝 3. 주요 포인트 정리

### 필수 구성 요소
- `"use client"`: 네이버 지도는 브라우저 환경에서만 작동하므로 클라이언트 컴포넌트 필요
- `useEffect`: Next.js의 SSR 환경을 고려해 스크립트를 동적으로 로드
- `declare global`: `window.naver` 타입 선언 필요

### API URL 및 파라미터 (2023년 이후 변경사항)
- **URL**: `https://oapi.map.naver.com/openapi/v3/maps.js` 사용
- **파라미터**: `ncpKeyId` 사용 (구버전 `ncpClientId`에서 변경됨)

### 추가 기능
- **여러 개의 마커**: 배열과 `forEach`로 반복 생성 가능
- **마커 클릭 이벤트**: `window.naver.maps.Event.addListener` 활용 가능

---

## 🔧 4. 고급 활용 예제

### 여러 마커 표시하기

```tsx
"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

interface Location {
  lat: number;
  lng: number;
  title: string;
}

export default function MapPage() {
  const locations: Location[] = [
    { lat: 37.3595704, lng: 127.105399, title: "네이버 그린팩토리" },
    { lat: 37.5665, lng: 126.9780, title: "서울시청" },
    { lat: 37.5511, lng: 126.9882, title: "남산타워" },
  ];

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;
    script.async = true;
    script.onload = () => {
      if (window.naver) {
        const map = new window.naver.maps.Map("map", {
          center: new window.naver.maps.LatLng(37.3595704, 127.105399),
          zoom: 12,
        });

        // 여러 마커 생성
        locations.forEach((location) => {
          new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(location.lat, location.lng),
            map: map,
            title: location.title,
          });
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div
      id="map"
      style={{ width: "100%", height: "500px", borderRadius: "8px" }}
    />
  );
}
```

### 마커 클릭 이벤트

```tsx
useEffect(() => {
  const script = document.createElement("script");
  script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;
  script.async = true;
  script.onload = () => {
    if (window.naver) {
      const map = new window.naver.maps.Map("map", {
        center: new window.naver.maps.LatLng(37.3595704, 127.105399),
        zoom: 15,
      });

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(37.3595704, 127.105399),
        map: map,
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, "click", () => {
        alert("마커를 클릭했습니다!");
      });
    }
  };
  document.head.appendChild(script);
}, []);
```

---

## 📚 5. API 키 발급 방법

1. [네이버 클라우드 플랫폼](https://console.ncloud.com/) 접속
2. 회원가입 및 로그인
3. **AI·NAVER API** > **Application 등록**
4. **Maps** > **Web Dynamic Map** 선택
5. **서비스 URL 등록** (예: `http://localhost:3000`)
6. **인증 정보** 탭에서 **Client ID** 확인

---

## 🌟 참고 자료

- [네이버 지도 API v3 공식 문서](https://navermaps.github.io/maps.js.ncp/docs/)
- [네이버 클라우드 플랫폼 Maps 가이드](https://guide.ncloud-docs.com/docs/ko/naveropenapiv3-maps-overview)
- [Next.js 공식 문서 - 환경 변수](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Next.js 공식 문서](https://nextjs.org/docs)

---

## ⚠️ 변경 이력 및 주의사항

### 2023년 주요 변경사항
네이버 클라우드 플랫폼 통합으로 인한 변경:

| 항목 | 구버전 | 신버전 (현재) |
|------|--------|---------------|
| URL | `openapi.map.naver.com` | `oapi.map.naver.com` |
| 파라미터 | `ncpClientId` | `ncpKeyId` |
| 콘솔 | 일반/공공/금융 분리 | 개인/일반 통합 |

### Next.js 버전 호환성
- ✅ **Next.js 15** (Active LTS) - 완전 지원
- ✅ **Next.js 14** - 완전 지원
- ✅ **Next.js 13.4+** (App Router) - 완전 지원

### TypeScript 타입 정의
더 정확한 타입 정의를 원하는 경우:
```bash
npm install --save-dev @types/navermaps
```

---

## 💡 문제 해결

### 지도가 표시되지 않는 경우
1. API 키가 정확한지 확인
2. 콘솔에서 URL 등록 여부 확인
3. `NEXT_PUBLIC_` 접두사 확인
4. 개발 서버 재시작 (환경 변수 변경 후)

### 타입 에러가 발생하는 경우
```tsx
// window.naver 타입 선언 확인
declare global {
  interface Window {
    naver: any;
  }
}
```

---

**작성:** 검증된 공식 문서 기반 (2025년 10월)  
**라이선스:** 네이버 지도 API 이용약관 준수 필요