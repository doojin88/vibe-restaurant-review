'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentPosition } from '@/lib/location/geolocation';
import { DEFAULT_LOCATION } from '@/constants/location';
import { HomeScreenProvider, useHomeScreenContext } from '@/features/home/context/HomeScreenContext';
import { NaverMapContainer } from '@/features/home/components/NaverMapContainer';
import { CurrentLocationMarker } from '@/features/home/components/CurrentLocationMarker';
import { MapMarker } from '@/features/home/components/MapMarker';
import { MapControls } from '@/features/home/components/MapControls';
import { SearchBar } from '@/features/home/components/SearchBar';
import { SearchResultsModal } from '@/features/home/components/SearchResultsModal';
import { usePlacesNearbyQuery } from '@/features/place/hooks/usePlacesNearbyQuery';

export default function HomePage() {
  return (
    <HomeScreenProvider>
      <HomePageContent />
    </HomeScreenProvider>
  );
}

function HomePageContent() {
  const {
    state,
    setMapCenter,
    setZoomLevel,
    setCurrentLocation,
    setLocationPermission,
    setMapLoading,
  } = useHomeScreenContext();
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const { data } = usePlacesNearbyQuery(state.currentLocation, 1000);
  const router = useRouter();

  useEffect(() => {
    setMapLoading(true);
    getCurrentPosition()
      .then((location) => {
        setCurrentLocation(location);
        setMapCenter(location);
        setLocationPermission('granted');
      })
      .catch(() => {
        // 현재 위치를 찾을 수 없는 경우 조용히 기본 위치(강남역) 사용
        setCurrentLocation(null);
        setMapCenter(DEFAULT_LOCATION);
        setLocationPermission('denied');
      })
      .finally(() => {
        setMapLoading(false);
      });
  }, [setCurrentLocation, setMapCenter, setLocationPermission, setMapLoading]);

  const handleMapCenterChanged = useDebouncedCallback(
    (center: { lat: number; lng: number }) => {
      setMapCenter(center);
    },
    300
  );

  const handleZoomIn = () => {
    setZoomLevel(state.zoomLevel + 1);
  };

  const handleZoomOut = () => {
    setZoomLevel(state.zoomLevel - 1);
  };

  const handleCurrentLocation = () => {
    if (state.currentLocation) {
      setMapCenter(state.currentLocation);
    }
  };

  const handlePlaceClick = (placeId: string) => {
    router.push(`/place/${placeId}`);
  };

  return (
    <div className="relative h-screen w-full">
      {state.mapLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80">
          <Skeleton className="h-full w-full" />
        </div>
      )}

      <NaverMapContainer
        center={state.mapCenter}
        zoom={state.zoomLevel}
        onMapLoad={setMap}
        onCenterChanged={handleMapCenterChanged}
        onZoomChanged={setZoomLevel}
      >
        <CurrentLocationMarker map={map} location={state.currentLocation} />

        {data?.places?.map((place) => (
          <MapMarker
            key={place.id}
            map={map}
            position={{ lat: place.latitude, lng: place.longitude }}
            icon={{
              content: '<div class="place-marker">📍</div>',
              size: { width: 24, height: 24 },
              anchor: { x: 12, y: 12 },
            }}
            onClick={() => handlePlaceClick(place.id)}
          />
        ))}
      </NaverMapContainer>

      <SearchBar />

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCurrentLocation={handleCurrentLocation}
      />

      <SearchResultsModal />

      {state.locationPermission === 'denied' && !state.currentLocation && (
        <Alert className="absolute bottom-4 left-4 right-4 z-10">
          <AlertTitle>기본 위치로 설정되었습니다</AlertTitle>
          <AlertDescription>
            현재 위치를 사용할 수 없어 서울시 강남역을 기준으로 표시합니다. 
            정확한 위치를 사용하려면 브라우저 설정에서 위치 권한을 허용해주세요.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

