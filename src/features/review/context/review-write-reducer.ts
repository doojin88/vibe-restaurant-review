import type { ReviewWriteState, ReviewWriteAction } from './review-write-types';

export const initialState: ReviewWriteState = {
  authorName: '',
  rating: 0,
  content: '',
  password: '',
  formValid: false,
  formDirty: false,

  authorNameError: null,
  ratingError: null,
  contentError: null,
  passwordError: null,
  formError: null,

  submitting: false,
  submitSuccess: false,
  submitError: null,
  submitComplete: false,

  placeData: null,
  placeLoading: false,
  placeError: null,

  backConfirm: false,
};

export function reviewWriteReducer(
  state: ReviewWriteState,
  action: ReviewWriteAction
): ReviewWriteState {
  switch (action.type) {
    case 'SET_AUTHOR_NAME':
      return { ...state, authorName: action.payload, formDirty: true };

    case 'SET_RATING':
      return { ...state, rating: action.payload, formDirty: true };

    case 'SET_CONTENT':
      return { ...state, content: action.payload, formDirty: true };

    case 'SET_PASSWORD':
      return { ...state, password: action.payload, formDirty: true };

    case 'SET_FORM_VALID':
      return { ...state, formValid: action.payload };

    case 'SET_FORM_DIRTY':
      return { ...state, formDirty: action.payload };

    case 'SET_AUTHOR_NAME_ERROR':
      return { ...state, authorNameError: action.payload };

    case 'SET_RATING_ERROR':
      return { ...state, ratingError: action.payload };

    case 'SET_CONTENT_ERROR':
      return { ...state, contentError: action.payload };

    case 'SET_PASSWORD_ERROR':
      return { ...state, passwordError: action.payload };

    case 'SET_FORM_ERROR':
      return { ...state, formError: action.payload };

    case 'SUBMIT_START':
      return {
        ...state,
        submitting: true,
        submitError: null,
        submitSuccess: false,
      };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        submitting: false,
        submitSuccess: true,
        submitComplete: true,
      };

    case 'SUBMIT_FAILURE':
      return {
        ...state,
        submitting: false,
        submitError: action.payload,
      };

    case 'SUBMIT_COMPLETE':
      return { ...state, submitComplete: true };

    case 'RESET_SUBMIT_STATE':
      return {
        ...state,
        submitting: false,
        submitSuccess: false,
        submitError: null,
        submitComplete: false,
      };

    case 'FETCH_PLACE_START':
      return { ...state, placeLoading: true, placeError: null };

    case 'FETCH_PLACE_SUCCESS':
      return {
        ...state,
        placeLoading: false,
        placeData: action.payload,
      };

    case 'FETCH_PLACE_FAILURE':
      return {
        ...state,
        placeLoading: false,
        placeError: action.payload,
      };

    case 'OPEN_BACK_CONFIRM':
      return { ...state, backConfirm: true };

    case 'CLOSE_BACK_CONFIRM':
      return { ...state, backConfirm: false };

    case 'RESET_FORM':
      return {
        ...initialState,
        placeData: state.placeData,
      };

    default:
      return state;
  }
}
