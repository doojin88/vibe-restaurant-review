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
    if (!mapRef.current || !window.naver || map) return;

    const newMap = createNaverMap(mapRef.current, {
      center,
      zoom,
    });

    const centerListener = naver.maps.Event.addListener(
      newMap,
      'center_changed',
      function () {
        const newCenter = newMap.getCenter();
        onCenterChanged?.({
          lat: newCenter.lat(),
          lng: newCenter.lng(),
        });
      }
    );

    const zoomListener = naver.maps.Event.addListener(
      newMap,
      'zoom_changed',
      function () {
        const newZoom = newMap.getZoom();
        onZoomChanged?.(newZoom);
      }
    );

    setMap(newMap);
    onMapLoad?.(newMap);

    return () => {
      naver.maps.Event.removeListener(centerListener);
      naver.maps.Event.removeListener(zoomListener);
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
