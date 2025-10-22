import type { HomeScreenState, HomeScreenAction } from './types';

export const initialState: HomeScreenState = {
  currentLocation: null,
  mapCenter: { lat: 37.5665, lng: 126.978 },
  zoomLevel: 13,
  mapLoading: false,
  locationPermission: 'prompt',
  searchKeyword: '',
  searchModalOpen: false,
  loading: false,
};

export function homeScreenReducer(
  state: HomeScreenState,
  action: HomeScreenAction
): HomeScreenState {
  switch (action.type) {
    case 'SET_MAP_CENTER':
      return { ...state, mapCenter: action.payload };

    case 'SET_ZOOM_LEVEL':
      return { ...state, zoomLevel: action.payload };

    case 'SET_MAP_LOADING':
      return { ...state, mapLoading: action.payload };

    case 'SET_LOCATION_PERMISSION':
      return { ...state, locationPermission: action.payload };

    case 'SET_CURRENT_LOCATION':
      return { ...state, currentLocation: action.payload };

    case 'SET_SEARCH_KEYWORD':
      return { ...state, searchKeyword: action.payload };

    case 'OPEN_SEARCH_MODAL':
      return { ...state, searchModalOpen: true };

    case 'CLOSE_SEARCH_MODAL':
      return { ...state, searchModalOpen: false };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}
