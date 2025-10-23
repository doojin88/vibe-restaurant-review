# 네이버 지도 API v3 사용 가이드

## 문서 개요

본 문서는 네이버 클라우드 플랫폼의 Maps API v3를 React/Next.js 프로젝트에서 사용하는 방법을 정리한 가이드입니다.

**최종 업데이트**: 2025-10-23
**API 버전**: NAVER Maps JavaScript API v3
**대상 독자**: React/Next.js 개발자

---

## 목차

1. [시작하기](#1-시작하기)
2. [기본 지도 구현](#2-기본-지도-구현)
3. [마커 사용법](#3-마커-사용법)
4. [지도 옵션 및 제어](#4-지도-옵션-및-제어)
5. [이벤트 처리](#5-이벤트-처리)
6. [마커 클러스터링](#6-마커-클러스터링)
7. [프로젝트 적용 예시](#7-프로젝트-적용-예시)
8. [참고 자료](#8-참고-자료)

---

## 1. 시작하기

### 1.1 네이버 클라우드 플랫폼 가입 및 인증키 발급

1. **네이버 클라우드 플랫폼 가입**
   - https://www.ncloud.com 접속
   - 회원가입 및 로그인

2. **Maps API 신청**
   - Console > Application Services > Maps 선택
   - Web Dynamic Map 서비스 신청
   - Client ID 발급받기

3. **환경 변수 설정**
   ```bash
   # .env.local
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your-client-id
   ```

### 1.2 프로젝트 설정

#### Next.js 프로젝트에 스크립트 추가

**방법 1: `next/script` 사용 (권장)**

`src/app/layout.tsx`에 추가:

```typescript
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <Script
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**방법 2: HTML `<head>`에 직접 추가**

```html
<script
  type="text/javascript"
  src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID"
></script>
```

#### TypeScript 타입 정의 설치

```bash
npm install --save-dev @types/navermaps
```

또는 프로젝트에서 수동으로 타입 정의:

```typescript
// src/types/navermaps.d.ts
declare global {
  interface Window {
    naver: typeof naver;
  }
}

export {};
```

---

## 2. 기본 지도 구현

### 2.1 가장 간단한 지도

**예제**: 서울 시청을 중심으로 하는 기본 지도

```typescript
'use client';

import { useEffect, useRef } from 'react';

export function SimpleMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

    // 기본 지도 생성 (서울 시청 중심, 줌 레벨 16)
    const map = new naver.maps.Map(mapRef.current);
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}
```

### 2.2 옵션을 지정한 지도

**예제**: 중심 좌표와 줌 레벨을 지정

```typescript
'use client';

import { useEffect, useRef } from 'react';

export function CustomMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(37.3595704, 127.105399), // 네이버 그린팩토리
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
    });
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}
```

### 2.3 주요 지도 옵션

| 옵션 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| `center` | `LatLng` | 지도 중심 좌표 | 서울 시청 |
| `zoom` | `number` | 줌 레벨 (1~21) | 16 |
| `minZoom` | `number` | 최소 줌 레벨 | 1 |
| `maxZoom` | `number` | 최대 줌 레벨 | 21 |
| `zoomControl` | `boolean` | 줌 컨트롤 표시 여부 | false |
| `mapTypeControl` | `boolean` | 지도 타입 컨트롤 표시 여부 | false |
| `scaleControl` | `boolean` | 스케일 컨트롤 표시 여부 | false |
| `mapDataControl` | `boolean` | 지도 데이터 컨트롤 표시 여부 | false |
| `draggable` | `boolean` | 드래그 가능 여부 | true |
| `scrollWheel` | `boolean` | 마우스 휠 줌 가능 여부 | true |

**참고**: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.html#.MapOptions

---

## 3. 마커 사용법

### 3.1 기본 마커

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

export function MapWithMarker() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

    const newMap = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(37.3595704, 127.105399),
      zoom: 15,
    });

    // 마커 생성
    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(37.3595704, 127.105399),
      map: newMap,
    });

    setMap(newMap);
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}
```

### 3.2 커스텀 아이콘 마커

```typescript
const marker = new naver.maps.Marker({
  position: new naver.maps.LatLng(37.3595704, 127.105399),
  map: map,
  icon: {
    content: '<div class="custom-marker">📍</div>',
    size: new naver.maps.Size(30, 30),
    anchor: new naver.maps.Point(15, 15),
  },
});
```

**CSS 스타일링**:

```css
.custom-marker {
  width: 30px;
  height: 30px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
```

### 3.3 마커 이벤트 처리

```typescript
const marker = new naver.maps.Marker({
  position: new naver.maps.LatLng(37.3595704, 127.105399),
  map: map,
});

// 마커 클릭 이벤트
naver.maps.Event.addListener(marker, 'click', function() {
  alert('마커를 클릭했습니다!');
});
```

### 3.4 정보창 표시

```typescript
const marker = new naver.maps.Marker({
  position: new naver.maps.LatLng(37.3595704, 127.105399),
  map: map,
});

const infoWindow = new naver.maps.InfoWindow({
  content: '<div style="padding:10px;">네이버 그린팩토리</div>',
});

naver.maps.Event.addListener(marker, 'click', function() {
  if (infoWindow.getMap()) {
    infoWindow.close();
  } else {
    infoWindow.open(map, marker);
  }
});
```

---

## 4. 지도 옵션 및 제어

### 4.1 지도 중심 이동

```typescript
// 좌표로 이동
map.setCenter(new naver.maps.LatLng(37.5665, 126.9780));

// 부드럽게 이동 (애니메이션)
map.panTo(new naver.maps.LatLng(37.5665, 126.9780));

// 줌 레벨과 함께 이동
map.morph(new naver.maps.LatLng(37.5665, 126.9780), 15);
```

### 4.2 줌 레벨 제어

```typescript
// 줌 레벨 설정
map.setZoom(17);

// 줌 인/아웃
map.setZoom(map.getZoom() + 1); // 줌 인
map.setZoom(map.getZoom() - 1); // 줌 아웃
```

### 4.3 지도 영역 가져오기

```typescript
// 현재 지도 중심 좌표
const center = map.getCenter();
console.log(center.lat(), center.lng());

// 현재 지도 영역
const bounds = map.getBounds();
console.log(bounds.getNE(), bounds.getSW());
```

**참고**: https://navermaps.github.io/maps.js.ncp/docs/tutorial-5-map-moves.example.html

---

## 5. 이벤트 처리

### 5.1 지도 이벤트

```typescript
// 지도 클릭 이벤트
naver.maps.Event.addListener(map, 'click', function(e) {
  console.log('클릭 위치:', e.coord.lat(), e.coord.lng());
});

// 지도 중심 변경 이벤트
naver.maps.Event.addListener(map, 'center_changed', function(center) {
  console.log('새로운 중심:', center.lat(), center.lng());
});

// 줌 레벨 변경 이벤트
naver.maps.Event.addListener(map, 'zoom_changed', function(zoom) {
  console.log('새로운 줌 레벨:', zoom);
});

// 드래그 종료 이벤트
naver.maps.Event.addListener(map, 'dragend', function() {
  console.log('드래그 종료');
});
```

### 5.2 이벤트 리스너 제거

```typescript
const listener = naver.maps.Event.addListener(map, 'click', function(e) {
  console.log('클릭!');
});

// 이벤트 리스너 제거
naver.maps.Event.removeListener(listener);
```

### 5.3 React 컴포넌트에서 이벤트 처리

```typescript
'use client';

import { useEffect, useRef } from 'react';

export function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(37.5665, 126.9780),
      zoom: 13,
    });

    // 이벤트 리스너 등록
    const clickListener = naver.maps.Event.addListener(
      map,
      'click',
      function(e: naver.maps.PointerEvent) {
        console.log('클릭 위치:', e.coord.lat(), e.coord.lng());
      }
    );

    // 컴포넌트 언마운트 시 정리
    return () => {
      naver.maps.Event.removeListener(clickListener);
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}
```

---

## 6. 마커 클러스터링

많은 수의 마커를 효율적으로 표시하기 위해 마커 클러스터링을 사용합니다.

### 6.1 라이브러리 추가

```html
<script src="https://navermaps.github.io/maps.js.ncp/docs/js/MarkerClustering.js"></script>
```

또는 npm 패키지 설치:

```bash
npm install @navermaps/marker-tools
```

### 6.2 기본 사용법

```typescript
import MarkerClustering from '@navermaps/marker-tools';

const markers = places.map((place) => {
  return new naver.maps.Marker({
    position: new naver.maps.LatLng(place.latitude, place.longitude),
    map: null, // 클러스터링에 관리를 위임하므로 null
  });
});

const markerClustering = new MarkerClustering({
  minClusterSize: 2,
  maxZoom: 13,
  map: map,
  markers: markers,
  disableClickZoom: false,
  gridSize: 120,
  icons: [
    {
      content: '<div class="cluster-marker">10+</div>',
      size: N.Size(40, 40),
      anchor: N.Point(20, 20),
    },
  ],
  indexGenerator: [10, 100, 200, 500, 1000],
  stylingFunction: function(clusterMarker, count) {
    clusterMarker.getElement().querySelector('div:first-child').innerText = count;
  },
});
```

**참고**:
- https://navermaps.github.io/maps.js.ncp/docs/tutorial-marker-cluster.example.html
- https://github.com/navermaps/marker-tools.js/blob/master/marker-clustering/README.md

---

## 7. 프로젝트 적용 예시

### 7.1 재사용 가능한 지도 컴포넌트

```typescript
// src/components/map/naver-map-container.tsx
'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface NaverMapContainerProps {
  center: { lat: number; lng: number };
  zoom: number;
  onMapLoad?: (map: naver.maps.Map) => void;
  onCenterChanged?: (center: { lat: number; lng: number }) => void;
  onZoomChanged?: (zoom: number) => void;
  children?: ReactNode;
}

export function NaverMapContainer({
  center,
  zoom,
  onMapLoad,
  onCenterChanged,
  onZoomChanged,
  children,
}: NaverMapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || !window.naver || map) return;

    const newMap = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
    });

    // 이벤트 리스너 등록
    const centerListener = naver.maps.Event.addListener(
      newMap,
      'center_changed',
      function(newCenter: naver.maps.Coord) {
        onCenterChanged?.({
          lat: newCenter.lat(),
          lng: newCenter.lng(),
        });
      }
    );

    const zoomListener = naver.maps.Event.addListener(
      newMap,
      'zoom_changed',
      function(newZoom: number) {
        onZoomChanged?.(newZoom);
      }
    );

    setMap(newMap);
    onMapLoad?.(newMap);

    return () => {
      naver.maps.Event.removeListener(centerListener);
      naver.maps.Event.removeListener(zoomListener);
    };
  }, []);

  // 중심 좌표 변경
  useEffect(() => {
    if (!map) return;
    map.setCenter(new naver.maps.LatLng(center.lat, center.lng));
  }, [map, center]);

  // 줌 레벨 변경
  useEffect(() => {
    if (!map) return;
    map.setZoom(zoom);
  }, [map, zoom]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      {map && children}
    </div>
  );
}
```

### 7.2 마커 컴포넌트

```typescript
// src/components/map/map-marker.tsx
'use client';

import { useEffect, useRef } from 'react';

interface MapMarkerProps {
  map: naver.maps.Map | null;
  position: { lat: number; lng: number };
  icon?: {
    content: string;
    size?: { width: number; height: number };
    anchor?: { x: number; y: number };
  };
  onClick?: () => void;
}

export function MapMarker({ map, position, icon, onClick }: MapMarkerProps) {
  const markerRef = useRef<naver.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || !window.naver) return;

    const markerOptions: naver.maps.MarkerOptions = {
      position: new naver.maps.LatLng(position.lat, position.lng),
      map,
    };

    if (icon) {
      markerOptions.icon = {
        content: icon.content,
        size: icon.size
          ? new naver.maps.Size(icon.size.width, icon.size.height)
          : undefined,
        anchor: icon.anchor
          ? new naver.maps.Point(icon.anchor.x, icon.anchor.y)
          : undefined,
      };
    }

    const marker = new naver.maps.Marker(markerOptions);

    if (onClick) {
      naver.maps.Event.addListener(marker, 'click', onClick);
    }

    markerRef.current = marker;

    return () => {
      marker.setMap(null);
    };
  }, [map, position, icon, onClick]);

  return null;
}
```

### 7.3 현재 위치 마커 컴포넌트

```typescript
// src/components/map/current-location-marker.tsx
'use client';

import { MapMarker } from './map-marker';

interface CurrentLocationMarkerProps {
  map: naver.maps.Map | null;
  location: { lat: number; lng: number } | null;
}

export function CurrentLocationMarker({
  map,
  location,
}: CurrentLocationMarkerProps) {
  if (!location) return null;

  return (
    <MapMarker
      map={map}
      position={location}
      icon={{
        content: '<div class="current-location-marker">📍</div>',
        size: { width: 30, height: 30 },
        anchor: { x: 15, y: 15 },
      }}
    />
  );
}
```

### 7.4 사용 예시

```typescript
// src/app/page.tsx
'use client';

import { useState } from 'react';
import { NaverMapContainer } from '@/components/map/naver-map-container';
import { CurrentLocationMarker } from '@/components/map/current-location-marker';

export default function HomePage() {
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [zoom, setZoom] = useState(13);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleMapLoad = (loadedMap: naver.maps.Map) => {
    setMap(loadedMap);
  };

  const handleCenterChanged = (newCenter: { lat: number; lng: number }) => {
    setCenter(newCenter);
  };

  const handleZoomChanged = (newZoom: number) => {
    setZoom(newZoom);
  };

  return (
    <div className="h-screen w-full">
      <NaverMapContainer
        center={center}
        zoom={zoom}
        onMapLoad={handleMapLoad}
        onCenterChanged={handleCenterChanged}
        onZoomChanged={handleZoomChanged}
      >
        <CurrentLocationMarker map={map} location={currentLocation} />
      </NaverMapContainer>
    </div>
  );
}
```

---

## 8. 참고 자료

### 8.1 공식 문서

- **Web Dynamic Map API 가이드**: https://guide.ncloud-docs.com/docs/maps-web-sdk
- **NAVER Maps JavaScript API v3 문서**: https://navermaps.github.io/maps.js.ncp/
- **지도 API 옵션**: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.html#.MapOptions
- **지도 클래스 레퍼런스**: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Map.html

### 8.2 예제 코드

- **기본 지도**: https://navermaps.github.io/maps.js.ncp/docs/tutorial-1-map-simple.example.html
- **지도 옵션**: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-map-options.example.html
- **지도 이동**: https://navermaps.github.io/maps.js.ncp/docs/tutorial-5-map-moves.example.html
- **마커 표시**: https://navermaps.github.io/maps.js.ncp/docs/tutorial-1-marker-simple.example.html
- **마커 클러스터**: https://navermaps.github.io/maps.js.ncp/docs/tutorial-marker-cluster.example.html
- **전체 예제**: https://navermaps.github.io/maps.js.ncp/docs/tutorial-digest.example.html

### 8.3 GitHub 저장소

- **marker-tools.js**: https://github.com/navermaps/marker-tools.js
- **마커 클러스터링 README**: https://github.com/navermaps/marker-tools.js/blob/master/marker-clustering/README.md

### 8.4 주의사항

- **2025년 AI NAVER API 변경**: 지도 API 신규 이용 신청 차단 및 무료 이용량 제공 중단 예정
- **네이버 클라우드 플랫폼으로 이전**: 새로운 프로젝트는 네이버 클라우드 플랫폼의 Maps API를 사용해야 함
- **인증 방식**: 네이버 클라우드 플랫폼 키 ID (ncpKeyId) 방식 사용

---

## 9. 트러블슈팅

### 9.1 지도가 표시되지 않음

**원인**:
- Client ID가 잘못되었거나 환경 변수가 설정되지 않음
- 스크립트 로드가 완료되지 않음
- 지도 컨테이너의 높이가 0

**해결 방법**:
```typescript
// 1. 환경 변수 확인
console.log(process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID);

// 2. naver 객체 확인
console.log(window.naver);

// 3. 컨테이너 높이 명시
<div ref={mapRef} style={{ width: '100%', height: '400px' }} />
```

### 9.2 타입 에러

**원인**: TypeScript 타입 정의가 없음

**해결 방법**:
```bash
npm install --save-dev @types/navermaps
```

또는 `src/types/navermaps.d.ts` 파일 생성

### 9.3 마커가 표시되지 않음

**원인**: 마커 위치가 지도 영역 밖에 있음

**해결 방법**:
```typescript
// 마커 위치로 지도 이동
map.setCenter(marker.getPosition());

// 또는 지도 영역에 마커 포함
const bounds = new naver.maps.LatLngBounds(
  marker1.getPosition(),
  marker2.getPosition()
);
map.fitBounds(bounds);
```

---

**문서 작성 완료**

이 가이드는 네이버 지도 API v3의 공식 문서와 예제를 기반으로 작성되었으며, React/Next.js 프로젝트에서 실제로 사용 가능한 코드 예시를 포함하고 있습니다.
