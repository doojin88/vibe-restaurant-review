import type { PlaceDetail } from '@/features/place/lib/dto';

export interface ReviewWriteState {
  // 폼 데이터
  authorName: string;
  rating: number;
  content: string;
  password: string;
  formValid: boolean;
  formDirty: boolean;

  // 폼 검증 에러
  authorNameError: string | null;
  ratingError: string | null;
  contentError: string | null;
  passwordError: string | null;
  formError: string | null;

  // 제출 상태
  submitting: boolean;
  submitSuccess: boolean;
  submitError: string | null;
  submitComplete: boolean;

  // 장소 정보
  placeData: PlaceDetail | null;
  placeLoading: boolean;
  placeError: string | null;

  // UI 상태
  backConfirm: boolean;
}

export type ReviewWriteAction =
  | { type: 'SET_AUTHOR_NAME'; payload: string }
  | { type: 'SET_RATING'; payload: number }
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_FORM_VALID'; payload: boolean }
  | { type: 'SET_FORM_DIRTY'; payload: boolean }
  | { type: 'SET_AUTHOR_NAME_ERROR'; payload: string | null }
  | { type: 'SET_RATING_ERROR'; payload: string | null }
  | { type: 'SET_CONTENT_ERROR'; payload: string | null }
  | { type: 'SET_PASSWORD_ERROR'; payload: string | null }
  | { type: 'SET_FORM_ERROR'; payload: string | null }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_FAILURE'; payload: string }
  | { type: 'SUBMIT_COMPLETE' }
  | { type: 'RESET_SUBMIT_STATE' }
  | { type: 'FETCH_PLACE_START' }
  | { type: 'FETCH_PLACE_SUCCESS'; payload: PlaceDetail }
  | { type: 'FETCH_PLACE_FAILURE'; payload: string }
  | { type: 'OPEN_BACK_CONFIRM' }
  | { type: 'CLOSE_BACK_CONFIRM' }
  | { type: 'RESET_FORM' };
