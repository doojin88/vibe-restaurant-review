export interface NaverMapOptions {
  center: { lat: number; lng: number };
  zoom?: number;
}

export function createNaverMap(
  container: HTMLElement,
  options: NaverMapOptions
): naver.maps.Map {
  if (!window.naver) {
    throw new Error('Naver Maps API is not loaded');
  }

  const { center, zoom = 13 } = options;

  const map = new naver.maps.Map(container, {
    center: new naver.maps.LatLng(center.lat, center.lng),
    zoom,
    zoomControl: false,
    mapDataControl: false,
    scaleControl: false,
    logoControl: false,
    draggable: true,
    scrollWheel: true,
  });

  return map;
}

export interface MarkerOptions {
  icon?: {
    content: string;
    size?: naver.maps.Size;
    anchor?: naver.maps.Point;
  };
}

export function createMarker(
  map: naver.maps.Map,
  position: { lat: number; lng: number },
  options?: MarkerOptions
): naver.maps.Marker {
  if (!window.naver) {
    throw new Error('Naver Maps API is not loaded');
  }

  const markerOptions: naver.maps.MarkerOptions = {
    position: new naver.maps.LatLng(position.lat, position.lng),
    map,
  };

  if (options?.icon) {
    markerOptions.icon = {
      content: options.icon.content,
      size: options.icon.size,
      anchor: options.icon.anchor,
    };
  }

  const marker = new naver.maps.Marker(markerOptions);

  return marker;
}
