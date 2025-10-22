export const PlaceErrorCode = {
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
  INVALID_LOCATION: 'INVALID_LOCATION',
  SEARCH_FAILED: 'SEARCH_FAILED',
  FETCH_FAILED: 'FETCH_FAILED',
} as const;

export type PlaceErrorCode = typeof PlaceErrorCode[keyof typeof PlaceErrorCode];
