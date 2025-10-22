'use client';

import { MapMarker } from './MapMarker';

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
        content: '<div class="current-location-marker">=Í</div>',
        size: { width: 30, height: 30 },
        anchor: { x: 15, y: 15 },
      }}
    />
  );
}
