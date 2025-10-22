'use client';

import { useEffect, useRef } from 'react';
import { createMarker } from '@/lib/map/naver-map';

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

    const markerOptions = icon
      ? {
          icon: {
            content: icon.content,
            size: icon.size
              ? new naver.maps.Size(icon.size.width, icon.size.height)
              : undefined,
            anchor: icon.anchor
              ? new naver.maps.Point(icon.anchor.x, icon.anchor.y)
              : undefined,
          },
        }
      : undefined;

    const marker = createMarker(map, position, markerOptions);

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
