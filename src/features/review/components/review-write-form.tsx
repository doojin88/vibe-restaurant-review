'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { useReviewWriteContext } from '../context/review-write-context';
import { ReviewFormFields } from './review-form-fields';
import { ReviewPlaceInfo } from './review-place-info';
import { ReviewBackConfirmDialog } from './review-back-confirm-dialog';

export function ReviewWriteForm() {
  const { state, submitForm, openBackConfirm } = useReviewWriteContext();

  const handleBack = () => {
    if (state.formDirty) {
      openBackConfirm();
    } else {
      window.history.back();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  if (state.placeLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (state.placeError) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{state.placeError}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => window.history.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={state.submitting}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">리뷰 작성</h1>
      </div>

      {state.placeData && <ReviewPlaceInfo place={state.placeData} />}

      <Separator className="my-6" />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>리뷰를 남겨주세요</CardTitle>
            <CardDescription>
              방문하신 장소에 대한 솔직한 리뷰를 작성해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ReviewFormFields />

            {state.formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.formError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!state.formValid || state.submitting}
            >
              {state.submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  작성 중...
                </>
              ) : (
                '리뷰 작성하기'
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      <ReviewBackConfirmDialog />
    </div>
  );
}
