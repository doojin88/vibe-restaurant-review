'use client';

import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHomeScreenContext } from '../context/HomeScreenContext';
import { usePlacesSearchQuery } from '@/features/place/hooks/usePlacesSearchQuery';

export function SearchResultsModal() {
  const { state, closeSearchModal } = useHomeScreenContext();
  const router = useRouter();

  const { data, isLoading, error } = usePlacesSearchQuery({
    q: state.searchKeyword,
    page: 1,
    limit: 10,
  });

  // 디버깅: 클라이언트 사이드에서 검색 결과 확인
  console.log('🔍 [CLIENT] 검색 키워드:', state.searchKeyword);
  console.log('📊 [CLIENT] 검색 결과:', data);
  console.log('⏳ [CLIENT] 로딩 상태:', isLoading);
  console.log('❌ [CLIENT] 에러 상태:', error);

  if (!state.searchModalOpen) return null;

  return (
    <Sheet open={state.searchModalOpen} onOpenChange={closeSearchModal}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>검색 결과</SheetTitle>
          <SheetDescription>
            "{state.searchKeyword}"에 대한 검색 결과입니다
            {data?.source === 'naver' && (
              <span className="ml-2 text-xs text-blue-600">(네이버 검색)</span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-500">검색 중 오류가 발생했습니다</p>
              <p className="text-sm text-muted-foreground mt-2">
                잠시 후 다시 시도해주세요
              </p>
            </div>
          )}

          {!isLoading && !error && data?.places?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">검색 결과가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-2">
                다른 키워드로 검색해보세요
              </p>
            </div>
          )}

          {data?.places?.map((place) => (
            <Card
              key={place.id}
              className="cursor-pointer hover:bg-accent"
              onClick={() => {
                // 네이버 검색 결과인 경우 상세 페이지로 이동하지 않고 지도에 표시
                if (place.source === 'naver') {
                  // TODO: 지도에 마커 표시 로직 추가
                  closeSearchModal();
                } else {
                  router.push(`/place/${place.id}`);
                  closeSearchModal();
                }
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg">{place.name}</CardTitle>
                <CardDescription>
                  {place.address}
                  <br />
                  {place.category}
                  {place.source === 'naver' && (
                    <span className="ml-2 text-xs text-blue-600">네이버 검색</span>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}