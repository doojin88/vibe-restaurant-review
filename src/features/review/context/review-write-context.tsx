'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import { usePlaceQuery } from '@/features/place/hooks/usePlaceQuery';
import { useCreateReviewMutation } from '@/features/review/hooks/useCreateReviewMutation';
import { CreateReviewSchema } from '@/features/review/lib/dto';
import { reviewWriteReducer, initialState } from './review-write-reducer';
import type { ReviewWriteState, ReviewWriteAction } from './review-write-types';
import { useToast } from '@/hooks/use-toast';

interface ReviewWriteContextType {
  state: ReviewWriteState;
  dispatch: React.Dispatch<ReviewWriteAction>;

  setAuthorName: (name: string) => void;
  setRating: (rating: number) => void;
  setContent: (content: string) => void;
  setPassword: (password: string) => void;

  validateForm: () => boolean;
  submitForm: () => Promise<void>;

  openBackConfirm: () => void;
  closeBackConfirm: () => void;
  confirmBack: () => void;

  getCharacterCount: () => number;
  getRemainingCharacters: () => number;
}

const ReviewWriteContext = createContext<ReviewWriteContextType | null>(null);

export function ReviewWriteProvider({
  placeId,
  children,
}: {
  placeId: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reviewWriteReducer, initialState);
  const router = useRouter();
  const { toast } = useToast();

  const { data: place, isLoading, error } = usePlaceQuery(placeId);
  const mutation = useCreateReviewMutation(placeId);

  useEffect(() => {
    if (isLoading) {
      dispatch({ type: 'FETCH_PLACE_START' });
    } else if (error) {
      dispatch({
        type: 'FETCH_PLACE_FAILURE',
        payload: error instanceof Error ? error.message : '장소 조회 실패',
      });
    } else if (place) {
      dispatch({ type: 'FETCH_PLACE_SUCCESS', payload: place });
    }
  }, [place, isLoading, error]);

  const setAuthorName = useCallback((name: string) => {
    dispatch({ type: 'SET_AUTHOR_NAME', payload: name });
    dispatch({ type: 'SET_AUTHOR_NAME_ERROR', payload: null });
  }, []);

  const setRating = useCallback((rating: number) => {
    dispatch({ type: 'SET_RATING', payload: rating });
    dispatch({ type: 'SET_RATING_ERROR', payload: null });
  }, []);

  const setContent = useCallback((content: string) => {
    dispatch({ type: 'SET_CONTENT', payload: content });
    dispatch({ type: 'SET_CONTENT_ERROR', payload: null });
  }, []);

  const setPassword = useCallback((password: string) => {
    dispatch({ type: 'SET_PASSWORD', payload: password });
    dispatch({ type: 'SET_PASSWORD_ERROR', payload: null });
  }, []);

  const validateForm = useCallback(() => {
    dispatch({ type: 'SET_AUTHOR_NAME_ERROR', payload: null });
    dispatch({ type: 'SET_RATING_ERROR', payload: null });
    dispatch({ type: 'SET_CONTENT_ERROR', payload: null });
    dispatch({ type: 'SET_PASSWORD_ERROR', payload: null });
    dispatch({ type: 'SET_FORM_ERROR', payload: null });

    const result = CreateReviewSchema.safeParse({
      authorName: state.authorName,
      rating: state.rating,
      content: state.content,
      password: state.password,
    });

    if (!result.success) {
      const errors = result.error.errors;
      errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'authorName') {
          dispatch({ type: 'SET_AUTHOR_NAME_ERROR', payload: err.message });
        } else if (field === 'rating') {
          dispatch({ type: 'SET_RATING_ERROR', payload: err.message });
        } else if (field === 'content') {
          dispatch({ type: 'SET_CONTENT_ERROR', payload: err.message });
        } else if (field === 'password') {
          dispatch({ type: 'SET_PASSWORD_ERROR', payload: err.message });
        }
      });
      dispatch({ type: 'SET_FORM_VALID', payload: false });
      return false;
    }

    dispatch({ type: 'SET_FORM_VALID', payload: true });
    return true;
  }, [state.authorName, state.rating, state.content, state.password]);

  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      await mutation.mutateAsync({
        authorName: state.authorName,
        rating: state.rating,
        content: state.content,
        password: state.password,
      });

      dispatch({ type: 'SUBMIT_SUCCESS' });

      toast({
        title: '리뷰가 등록되었습니다.',
        description: '감사합니다!',
      });

      setTimeout(() => {
        router.push(`/place/${placeId}`);
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '리뷰 작성에 실패했습니다.';

      dispatch({ type: 'SUBMIT_FAILURE', payload: message });

      toast({
        title: '오류',
        description: message,
        variant: 'destructive',
      });
    }
  }, [
    validateForm,
    mutation,
    state.authorName,
    state.rating,
    state.content,
    state.password,
    placeId,
    router,
    toast,
  ]);

  const openBackConfirm = useCallback(() => {
    dispatch({ type: 'OPEN_BACK_CONFIRM' });
  }, []);

  const closeBackConfirm = useCallback(() => {
    dispatch({ type: 'CLOSE_BACK_CONFIRM' });
  }, []);

  const confirmBack = useCallback(() => {
    router.back();
  }, [router]);

  const getCharacterCount = useCallback(() => {
    return state.content.length;
  }, [state.content]);

  const getRemainingCharacters = useCallback(() => {
    return 500 - state.content.length;
  }, [state.content]);

  const value: ReviewWriteContextType = {
    state,
    dispatch,
    setAuthorName,
    setRating,
    setContent,
    setPassword,
    validateForm,
    submitForm,
    openBackConfirm,
    closeBackConfirm,
    confirmBack,
    getCharacterCount,
    getRemainingCharacters,
  };

  return (
    <ReviewWriteContext.Provider value={value}>
      {children}
    </ReviewWriteContext.Provider>
  );
}

export function useReviewWriteContext() {
  const context = useContext(ReviewWriteContext);
  if (!context) {
    throw new Error(
      'useReviewWriteContext must be used within ReviewWriteProvider'
    );
  }
  return context;
}
