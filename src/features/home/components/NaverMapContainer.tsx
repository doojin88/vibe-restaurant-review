'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createNaverMap } from '@/lib/map/naver-map';

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

  useEffect(() => {
    if (!mapRef.current || map) return;
    
    // 네이버 지도 API 로딩 확인
    if (!window.naver) {
      console.error('네이버 지도 API가 로드되지 않았습니다. 클라이언트 ID를 확인해주세요.');
      return;
    }
    
    if (!window.naver.maps) {
      console.error('네이버 지도 API의 maps 모듈이 로드되지 않았습니다.');
      return;
    }

    const newMap = createNaverMap(mapRef.current, {
      center,
      zoom,
    });

    const centerListener = function () {
      const newCenter = newMap.getCenter();
      onCenterChanged?.({
        lat: newCenter.lat(),
        lng: newCenter.lng(),
      });
    };

    const zoomListener = function () {
      const newZoom = newMap.getZoom();
      onZoomChanged?.(newZoom);
    };

    naver.maps.Event.addListener(newMap, 'center_changed', centerListener);
    naver.maps.Event.addListener(newMap, 'zoom_changed', zoomListener);

    setMap(newMap);
    onMapLoad?.(newMap);

    return () => {
      naver.maps.Event.removeListener(newMap, 'center_changed', centerListener);
      naver.maps.Event.removeListener(newMap, 'zoom_changed', zoomListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map) return;
    map.setCenter(new naver.maps.LatLng(center.lat, center.lng));
  }, [map, center]);

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
