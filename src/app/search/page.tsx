'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceCard } from '@/features/place/components/place-card';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { usePlacesSearchInfiniteQuery } from '@/features/place/hooks/usePlacesSearchInfiniteQuery';
import { useSearchStore } from '@/stores/search-store';
import { useInView } from 'react-intersection-observer';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get('q') ?? '';

  const { addToHistory } = useSearchStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = usePlacesSearchInfiniteQuery({ keyword });

  const { ref, inView } = useInView({
    threshold: 0,
  });

  // 검색 히스토리에 추가
  useEffect(() => {
    if (keyword.trim()) {
      addToHistory(keyword);
    }
  }, [keyword, addToHistory]);

  // 무한 스크롤 트리거
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 키워드가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!keyword.trim()) {
      router.replace('/');
    }
  }, [keyword, router]);

  const handleBack = () => {
    router.back();
  };

  const handlePlaceCardClick = (place: any) => {
    router.push(`/place/${place.id}`);
  };

  const handleReviewClick = (place: any) => {
    router.push(`/place/${place.id}/review`);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" label="검색 중..." />
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">검색 결과</h1>
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <EmptyState
          title="검색 중 오류가 발생했습니다"
          description={error?.message ?? '다시 시도해주세요.'}
          actionLabel="다시 시도"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const allPlaces = data?.pages.flatMap((page) => page.places) ?? [];
  const totalResults = data?.pages[0]?.total ?? 0;

  // 빈 상태
  if (allPlaces.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">검색 결과</h1>
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <EmptyState
          title="검색 결과가 없습니다"
          description={`"${keyword}"에 대한 검색 결과를 찾을 수 없습니다.`}
          actionLabel="홈으로 돌아가기"
          onAction={() => router.push('/')}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">검색 결과</h1>
          <p className="text-sm text-muted-foreground">
            &quot;{keyword}&quot; 검색 결과 {totalResults}개
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* 검색 결과 리스트 */}
      <div className="space-y-4">
        {allPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onCardClick={handlePlaceCardClick}
            onReviewClick={handleReviewClick}
          />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <LoadingSpinner size="sm" label="추가 결과 로딩 중..." />
          ) : (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
            >
              더 보기
            </Button>
          )}
        </div>
      )}

      {/* 모든 결과 로드 완료 */}
      {!hasNextPage && allPlaces.length > 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          모든 검색 결과를 불러왔습니다.
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" label="검색 중..." />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
