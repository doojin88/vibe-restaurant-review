export const ReviewErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
  REVIEW_CREATE_FAILED: 'REVIEW_CREATE_FAILED',
  PASSWORD_HASH_FAILED: 'PASSWORD_HASH_FAILED',
  REVIEW_FETCH_FAILED: 'REVIEW_FETCH_FAILED',
} as const;

export type ReviewErrorCode = typeof ReviewErrorCode[keyof typeof ReviewErrorCode];
