'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import { homeScreenReducer, initialState } from './reducer';
import type { HomeScreenState, LocationPermission } from './types';

interface HomeScreenContextType {
  state: HomeScreenState;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setZoomLevel: (level: number) => void;
  setMapLoading: (loading: boolean) => void;
  setLocationPermission: (permission: LocationPermission) => void;
  setCurrentLocation: (location: { lat: number; lng: number } | null) => void;
  setSearchKeyword: (keyword: string) => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  setLoading: (loading: boolean) => void;
  resetState: () => void;
}

const HomeScreenContext = createContext<HomeScreenContextType | null>(null);

export function HomeScreenProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(homeScreenReducer, initialState);

  const setMapCenter = useCallback((center: { lat: number; lng: number }) => {
    dispatch({ type: 'SET_MAP_CENTER', payload: center });
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: level });
  }, []);

  const setMapLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_MAP_LOADING', payload: loading });
  }, []);

  const setLocationPermission = useCallback((permission: LocationPermission) => {
    dispatch({ type: 'SET_LOCATION_PERMISSION', payload: permission });
  }, []);

  const setCurrentLocation = useCallback(
    (location: { lat: number; lng: number } | null) => {
      dispatch({ type: 'SET_CURRENT_LOCATION', payload: location });
    },
    []
  );

  const setSearchKeyword = useCallback((keyword: string) => {
    dispatch({ type: 'SET_SEARCH_KEYWORD', payload: keyword });
  }, []);

  const openSearchModal = useCallback(() => {
    dispatch({ type: 'OPEN_SEARCH_MODAL' });
  }, []);

  const closeSearchModal = useCallback(() => {
    dispatch({ type: 'CLOSE_SEARCH_MODAL' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return (
    <HomeScreenContext.Provider
      value={{
        state,
        setMapCenter,
        setZoomLevel,
        setMapLoading,
        setLocationPermission,
        setCurrentLocation,
        setSearchKeyword,
        openSearchModal,
        closeSearchModal,
        setLoading,
        resetState,
      }}
    >
      {children}
    </HomeScreenContext.Provider>
  );
}

export function useHomeScreenContext() {
  const context = useContext(HomeScreenContext);
  if (!context) {
    throw new Error(
      'useHomeScreenContext must be used within HomeScreenProvider'
    );
  }
  return context;
}
