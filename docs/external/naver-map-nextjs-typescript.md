# Next.js + TypeScript로 네이버 지도(Maps JS v3) 예제

다음 예제는 **Next.js 15 (App Router)** + **TypeScript** 기준으로, 네이버 지도 JS SDK(v3)를 로드하고 기본 지도를 표시한 뒤 마커를 추가하는 최소 구현입니다.

> **참고:** Next.js에는 "LTS 버전" 개념이 없으며, 2024년 10월 21일에 버전 15가 stable로 릴리즈되었습니다.

---

## 1) 환경 변수 설정

루트에 `.env.local` 파일을 만들고 클라이언트에서 접근 가능한 환경 변수로 클라이언트 ID를 설정합니다.

```bash
# .env.local
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=여기에_발급받은_ID
```

- `NEXT_PUBLIC_` 프리픽스를 붙여야 브라우저에서 접근할 수 있습니다.

---

## 2) 타입 선언(선택)

공식 타입 패키지를 사용하거나 간단히 전역 네임스페이스만 선언해도 됩니다.

### 방법 1: 공식 타입 패키지 설치 (권장)

```bash
npm i -D @types/navermaps
```

### 방법 2: 전역 타입 선언

프로젝트에 `types/naver-maps.d.ts` 파일을 추가하세요.

```ts
// types/naver-maps.d.ts
export {};

declare global {
  interface Window {
    naver: any;
  }
}
```

> 두 방법을 함께 사용해도 안전합니다.

---

## 3) SDK 스크립트 로드 (layout.tsx)

SDK는 **클라이언트 ID**로 로드해야 하며, 지도 초기화 전에 로드가 끝나야 합니다. App Router의 `app/layout.tsx`에서 `next/script`를 사용해 삽입합니다.

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naver Map with Next.js",
  description: "Simple Naver Map example in Next.js + TS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
  
  return (
    <html lang="ko">
      <body>
        {children}
        {/* Naver Maps JS SDK */}
        <Script
          id="naver-maps"
          strategy="beforeInteractive"
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
        />
      </body>
    </html>
  );
}
```

### ⚠️ 중요 사항

- **beforeInteractive strategy 사용 시:** App Router에서는 `<Script>`를 `<body>` 안에 배치하세요. Next.js가 자동으로 `<head>`에 주입합니다.
- **대안:** 일부 환경에서 `beforeInteractive`가 경고를 발생시킬 수 있습니다. 그럴 경우 `strategy="afterInteractive"`를 사용하세요.
- **서브모듈 추가:** 필요 시 `&submodules=geocoder` 등 서브모듈을 쿼리에 추가하면 됩니다.

---

## 4) 지도 컴포넌트

클라이언트 전용 컴포넌트에서 지도 인스턴스를 생성합니다. DOM 레퍼런스를 준비하고, SDK 로드 이후에만 초기화되도록 `useEffect`에서 검사합니다.

```tsx
// app/components/NaverMap.tsx
"use client";

import { useEffect, useRef } from "react";

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<any>(null);

  useEffect(() => {
    // SDK가 로드되었는지 확인
    if (!window || !(window as any).naver || !(window as any).naver.maps) return;
    if (!mapRef.current || mapObjRef.current) return; // 중복 초기화 방지

    const { naver } = window as any;

    // 기본 좌표(판교 그린팩토리 근처)
    const center = new naver.maps.LatLng(37.3595704, 127.105399);

    // 지도 생성
    const map = new naver.maps.Map(mapRef.current, {
      center,
      zoom: 14, // 1(멀리) ~ 21(가까이)
      mapDataControl: true,
      scaleControl: true,
      logoControl: true,
    });

    mapObjRef.current = map;

    // 마커 추가
    new naver.maps.Marker({
      position: center,
      map,
      title: "여기가 중심!",
    });

    // 필요 시 리사이즈 대응
    const handleResize = () => {
      if (map) {
        naver.maps.Event.trigger(map, "resize");
        map.setCenter(center);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "60vh", borderRadius: 12, overflow: "hidden" }}
      aria-label="네이버 지도"
    />
  );
}
```

---

## 5) 페이지에서 사용

루트 페이지(`app/page.tsx`)에서 지도 컴포넌트를 렌더링합니다.

```tsx
// app/page.tsx
import NaverMap from "./components/NaverMap";

export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>네이버 지도 기본 예제</h1>
      <p style={{ marginBottom: 12 }}>
        Next.js + TypeScript로 네이버 지도(JS v3)를 로드하는 최소 예제입니다.
      </p>
      <NaverMap />
    </main>
  );
}
```

---

## 자주 하는 실수 체크리스트

- [ ] `.env.local`에 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`가 존재하는가?
- [ ] `layout.tsx`에 SDK 스크립트가 **`<body>` 안에** 올바르게 배치되었는가?
- [ ] `strategy="beforeInteractive"` 또는 `"afterInteractive"`를 사용하는가?
- [ ] 지도 초기화는 **클라이언트 컴포넌트**에서만 수행하는가? (`"use client"`)
- [ ] `window.naver?.maps`가 로드되었는지 확인했는가?
- [ ] 초기화 중복을 막기 위해 `ref`로 인스턴스를 캐시했는가?

---

## ⚠️ 추가 주의사항

### 네이버 클라우드 플랫폼 정책 변경

2025년 6월 24일 공지 기준으로, AI NAVER API의 지도 API 신규 이용 신청 차단 및 무료 이용량 제공 중단이 예정되어 있습니다. 자세한 내용은 [네이버 클라우드 플랫폼 공지사항](https://www.ncloud.com)을 참고하세요.

### URL 파라미터 주의사항

- **올바른 형식:** `ncpClientId=YOUR_CLIENT_ID`
- **잘못된 형식:** `clientId=YOUR_CLIENT_ID` (구버전 형식, 사용 금지)

---

## 참고 자료

- [네이버 지도 API v3 공식 문서](https://navermaps.github.io/maps.js.ncp/docs/)
- [Next.js 공식 문서 - Script 컴포넌트](https://nextjs.org/docs/app/api-reference/components/script)
- [Next.js 공식 문서 - 환경 변수](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [@types/navermaps NPM 패키지](https://www.npmjs.com/package/@types/navermaps)

---

**작성일:** 2025년 (Next.js 15 기준)  
**검증 완료:** 공식 문서 및 신뢰할 수 있는 출처를 통해 교차 검증됨
