'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useReviewsInfiniteQuery } from '@/features/review/hooks/useReviewsInfiniteQuery';
import { ReviewItem } from './review-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReviewListProps {
  placeId: string;
}

export function ReviewList({ placeId }: ReviewListProps) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReviewsInfiniteQuery(placeId);

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertDescription>리뷰를 불러올 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  const reviews = data?.pages.flatMap((page) => page.reviews) ?? [];

  if (reviews.length === 0) {
    return (
      <div className="mt-6 text-center py-12 text-muted-foreground">
        등록된 리뷰가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-semibold">리뷰</h2>
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}

      {hasNextPage && (
        <div ref={ref} className="py-4">
          {isFetchingNextPage && <Skeleton className="h-32 w-full" />}
        </div>
      )}
    </div>
  );
}
