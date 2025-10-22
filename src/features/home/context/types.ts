export type LocationPermission = 'granted' | 'denied' | 'prompt' | 'error';

export interface HomeScreenState {
  currentLocation: { lat: number; lng: number } | null;
  mapCenter: { lat: number; lng: number };
  zoomLevel: number;
  mapLoading: boolean;
  locationPermission: LocationPermission;
  searchKeyword: string;
  searchModalOpen: boolean;
  loading: boolean;
}

export type HomeScreenAction =
  | { type: 'SET_MAP_CENTER'; payload: { lat: number; lng: number } }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'SET_MAP_LOADING'; payload: boolean }
  | { type: 'SET_LOCATION_PERMISSION'; payload: LocationPermission }
  | { type: 'SET_CURRENT_LOCATION'; payload: { lat: number; lng: number } | null }
  | { type: 'SET_SEARCH_KEYWORD'; payload: string }
  | { type: 'OPEN_SEARCH_MODAL' }
  | { type: 'CLOSE_SEARCH_MODAL' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_STATE' };
