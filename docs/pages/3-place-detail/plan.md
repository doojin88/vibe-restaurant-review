# 장소 상세 페이지 (3-place-detail) 구현 계획

## 문서 개요
본 문서는 `/place/[id]` 장소 상세 페이지의 엄밀한 구현 계획을 정의합니다. 프로젝트의 기존 아키텍처를 준수하고, DRY 원칙을 철저히 따르며, 문서에 명시된 기능만 구현합니다.

---

## 1. 프로젝트 현황 파악

### 1.1 기존 문서 분석
- **PRD**: Next.js 15 + Hono + Supabase 아키텍처 확인
- **Userflow**: 장소 상세 조회 및 리뷰 목록 표시 플로우 확인
- **Database**: places, reviews 테이블 설계 확인
- **Common Modules**: 공통 모듈 구현 필요 확인
- **UC-003**: 장소 상세 정보 조회 및 리뷰 목록 표시 유스케이스 확인
- **State Design**: Context + useReducer 패턴 상태관리 설계 확인

### 1.2 기존 코드베이스 분석
- **백엔드**: `src/features/example/backend` 패턴 확인 (place, review 미구현)
- **프론트엔드**: `src/features/example/hooks` 패턴 확인
- **Hono 앱**: `src/backend/hono/app.ts`에서 라우터 등록 방식 확인
- **데이터베이스**: `supabase/migrations/0001_create_example_table.sql` 패턴 확인
- **페이지**: `src/app/place/[id]` 디렉토리 미존재 확인

### 1.3 충돌 가능성 판단
✅ **충돌 없음**: place, review 관련 코드가 아직 구현되지 않음
✅ **안전한 구현 가능**: 기존 코드베이스 구조를 따르면 충돌 방지 가능

---

## 2. 구현 우선순위 및 순서

### Phase 0: 공통 모듈 구현 (선행 작업)
**우선순위**: P0 (최우선)
**이유**: 장소 상세 페이지는 place, review 백엔드/프론트엔드 공통 모듈에 의존

**필수 선행 작업**:
1. 데이터베이스 마이그레이션 (places, reviews 테이블)
2. 백엔드 공통 모듈 (place, review features)
3. 프론트엔드 공통 훅 (usePlaceQuery, useReviewsQuery)
4. API 클라이언트 설정

> **중요**: 이 계획서는 Phase 0이 완료된 것을 전제로 작성됨

### Phase 1: 백엔드 API 구현 (1일)
1.1. 장소 조회 API 검증
1.2. 리뷰 목록 조회 API 검증
1.3. API 응답 스키마 검증

### Phase 2: 상태관리 구현 (1일)
2.1. PlaceDetailContext 구현
2.2. PlaceDetailProvider 구현
2.3. Custom Hook (usePlaceDetailContext) 구현

### Phase 3: UI 컴포넌트 구현 (2일)
3.1. 페이지 레이아웃 구현
3.2. 장소 정보 컴포넌트
3.3. 평점 요약 컴포넌트
3.4. 리뷰 목록 컴포넌트
3.5. 리뷰 수정/삭제 기능

### Phase 4: 통합 및 테스트 (1일)
4.1. 페이지 통합
4.2. E2E 테스트
4.3. 성능 최적화
4.4. 접근성 검증

---

## 3. 단계별 상세 구현 계획

### Phase 1: 백엔드 API 검증 및 보완

#### 1.1 장소 조회 API 검증
**파일**: `src/features/place/backend/route.ts` (공통 모듈에서 구현됨)

**검증 사항**:
- `GET /api/places/{placeId}` 엔드포인트 존재 확인
- 응답 스키마 검증 (PlaceDetailSchema)
- 평균 평점 및 리뷰 개수 포함 확인

**예상 응답**:
```typescript
{
  ok: true,
  data: {
    place: {
      id: string;
      name: string;
      address: string;
      category: string;
      latitude: number;
      longitude: number;
      averageRating: number;
      reviewCount: number;
    }
  }
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (새로 구현)

---

#### 1.2 리뷰 목록 조회 API 검증
**파일**: `src/features/review/backend/route.ts` (공통 모듈에서 구현됨)

**검증 사항**:
- `GET /api/places/{placeId}/reviews` 엔드포인트 존재 확인
- 페이지네이션 지원 확인 (page, limit)
- 최신순 정렬 확인 (created_at DESC)

**예상 응답**:
```typescript
{
  ok: true,
  data: {
    reviews: Array<{
      id: string;
      authorName: string;
      rating: number;
      content: string;
      createdAt: string;
    }>;
    total: number;
    hasMore: boolean;
  }
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (새로 구현)

---

#### 1.3 API 응답 스키마 검증
**파일**:
- `src/features/place/backend/schema.ts`
- `src/features/review/backend/schema.ts`

**검증 사항**:
- Zod 스키마 정의 확인
- 타입 추론 확인 (z.infer)
- DTO 재노출 확인 (`src/features/*/lib/dto.ts`)

**기존 코드와의 충돌 여부**: ❌ 없음 (새로 구현)

---

### Phase 2: 상태관리 구현

#### 2.1 PlaceDetailContext 구현
**파일**: `src/features/place/context/place-detail-context.tsx` (신규)

**구현 내용**:
```typescript
'use client';

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

// 상태 타입 정의
interface PlaceDetailState {
  // 장소 정보
  placeData: Place | null;
  placeLoading: boolean;
  placeError: string | null;

  // 리뷰 정보
  reviews: Review[];
  reviewsLoading: boolean;
  reviewsError: string | null;
  reviewsPagination: {
    currentPage: number;
    hasMore: boolean;
  };

  // UI 상태
  selectedReview: Review | null;
}

// 액션 타입 정의
type PlaceDetailAction =
  | { type: 'FETCH_PLACE_START' }
  | { type: 'FETCH_PLACE_SUCCESS'; payload: Place }
  | { type: 'FETCH_PLACE_FAILURE'; payload: string }
  | { type: 'FETCH_REVIEWS_START' }
  | { type: 'FETCH_REVIEWS_SUCCESS'; payload: { reviews: Review[]; hasMore: boolean } }
  | { type: 'FETCH_REVIEWS_FAILURE'; payload: string }
  | { type: 'LOAD_MORE_REVIEWS'; payload: { reviews: Review[]; hasMore: boolean } }
  | { type: 'SET_SELECTED_REVIEW'; payload: Review | null }
  | { type: 'RESET_STATE' };

// Context 타입 정의
interface PlaceDetailContextType {
  state: PlaceDetailState;
  fetchPlace: (placeId: string) => Promise<void>;
  fetchReviews: (placeId: string, page?: number) => Promise<void>;
  loadMoreReviews: () => Promise<void>;
  setSelectedReview: (review: Review | null) => void;
  resetState: () => void;
}

const PlaceDetailContext = createContext<PlaceDetailContextType | null>(null);

// Reducer 구현
const initialState: PlaceDetailState = {
  placeData: null,
  placeLoading: false,
  placeError: null,
  reviews: [],
  reviewsLoading: false,
  reviewsError: null,
  reviewsPagination: { currentPage: 1, hasMore: false },
  selectedReview: null,
};

function placeDetailReducer(
  state: PlaceDetailState,
  action: PlaceDetailAction
): PlaceDetailState {
  switch (action.type) {
    case 'FETCH_PLACE_START':
      return { ...state, placeLoading: true, placeError: null };

    case 'FETCH_PLACE_SUCCESS':
      return { ...state, placeLoading: false, placeData: action.payload };

    case 'FETCH_PLACE_FAILURE':
      return { ...state, placeLoading: false, placeError: action.payload };

    case 'FETCH_REVIEWS_START':
      return { ...state, reviewsLoading: true, reviewsError: null };

    case 'FETCH_REVIEWS_SUCCESS':
      return {
        ...state,
        reviewsLoading: false,
        reviews: action.payload.reviews,
        reviewsPagination: { currentPage: 1, hasMore: action.payload.hasMore },
      };

    case 'FETCH_REVIEWS_FAILURE':
      return { ...state, reviewsLoading: false, reviewsError: action.payload };

    case 'LOAD_MORE_REVIEWS':
      return {
        ...state,
        reviews: [...state.reviews, ...action.payload.reviews],
        reviewsPagination: {
          currentPage: state.reviewsPagination.currentPage + 1,
          hasMore: action.payload.hasMore,
        },
      };

    case 'SET_SELECTED_REVIEW':
      return { ...state, selectedReview: action.payload };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Provider 구현
export function PlaceDetailProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(placeDetailReducer, initialState);

  // 액션 함수들 구현 (useCallback으로 메모이제이션)
  const fetchPlace = useCallback(async (placeId: string) => {
    // 구현 생략 (React Query 사용)
  }, []);

  const fetchReviews = useCallback(async (placeId: string, page = 1) => {
    // 구현 생략 (React Query 사용)
  }, []);

  const loadMoreReviews = useCallback(async () => {
    // 구현 생략
  }, [state.reviewsPagination]);

  const setSelectedReview = useCallback((review: Review | null) => {
    dispatch({ type: 'SET_SELECTED_REVIEW', payload: review });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      fetchPlace,
      fetchReviews,
      loadMoreReviews,
      setSelectedReview,
      resetState,
    }),
    [state, fetchPlace, fetchReviews, loadMoreReviews, setSelectedReview, resetState]
  );

  return (
    <PlaceDetailContext.Provider value={value}>
      {children}
    </PlaceDetailContext.Provider>
  );
}

// Custom Hook
export function usePlaceDetailContext() {
  const context = useContext(PlaceDetailContext);
  if (!context) {
    throw new Error('usePlaceDetailContext must be used within PlaceDetailProvider');
  }
  return context;
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (신규 파일)

**DRY 준수**:
- React Query는 공통 훅(`usePlaceQuery`, `useReviewsQuery`)에서 재사용
- Reducer 패턴으로 상태 로직 중앙화
- Context를 통해 props drilling 방지

---

### Phase 3: UI 컴포넌트 구현

#### 3.1 페이지 레이아웃 구현
**파일**: `src/app/place/[id]/page.tsx` (신규)

**구현 내용**:
```typescript
'use client';

import { use } from 'react';
import { PlaceDetailProvider } from '@/features/place/context/place-detail-context';
import { PlaceInfoCard } from '@/features/place/components/place-info-card';
import { RatingSummary } from '@/features/review/components/rating-summary';
import { ReviewList } from '@/features/review/components/review-list';
import { ReviewWriteButton } from '@/features/review/components/review-write-button';

interface PlaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { id } = use(params);

  return (
    <PlaceDetailProvider>
      <PlaceDetailPageContent placeId={id} />
    </PlaceDetailProvider>
  );
}

function PlaceDetailPageContent({ placeId }: { placeId: string }) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* 장소 정보 카드 */}
      <PlaceInfoCard placeId={placeId} />

      {/* 평점 요약 */}
      <RatingSummary placeId={placeId} />

      {/* 리뷰 작성 버튼 */}
      <ReviewWriteButton placeId={placeId} />

      {/* 리뷰 목록 */}
      <ReviewList placeId={placeId} />
    </div>
  );
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (신규 파일)

**DRY 준수**:
- Context Provider로 상태 공유
- 컴포넌트 분리로 재사용성 확보
- placeId를 props로 전달하여 의존성 명확화

---

#### 3.2 장소 정보 컴포넌트
**파일**: `src/features/place/components/place-info-card.tsx` (신규)

**구현 내용**:
```typescript
'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePlaceQuery } from '@/features/place/hooks/usePlaceQuery';
import { usePlaceDetailContext } from '@/features/place/context/place-detail-context';

interface PlaceInfoCardProps {
  placeId: string;
}

export function PlaceInfoCard({ placeId }: PlaceInfoCardProps) {
  const { data: place, isLoading, error } = usePlaceQuery(placeId);
  const { state, fetchPlace } = usePlaceDetailContext();

  // Context에 장소 정보 저장
  useEffect(() => {
    if (place) {
      fetchPlace(placeId);
    }
  }, [place, placeId, fetchPlace]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>장소 정보를 불러올 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  if (!place) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{place.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{place.address}</p>
        <p className="text-sm font-medium">{place.category}</p>
      </CardContent>
    </Card>
  );
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (신규 파일)

**DRY 준수**:
- `usePlaceQuery` 훅 재사용 (공통 모듈)
- shadcn-ui 컴포넌트 재사용 (Card, Skeleton, Alert)
- 로딩/에러 처리 패턴 일관성 유지

---

#### 3.3 평점 요약 컴포넌트
**파일**: `src/features/review/components/rating-summary.tsx` (신규)

**구현 내용**:
```typescript
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { usePlaceQuery } from '@/features/place/hooks/usePlaceQuery';

interface RatingSummaryProps {
  placeId: string;
}

export function RatingSummary({ placeId }: RatingSummaryProps) {
  const { data: place } = usePlaceQuery(placeId);

  if (!place) {
    return null;
  }

  const { averageRating, reviewCount } = place;

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
            <span className="ml-2 text-3xl font-bold">
              {averageRating.toFixed(1)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {reviewCount}개의 리뷰
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (신규 파일)

**DRY 준수**:
- `usePlaceQuery` 훅 재사용
- lucide-react 아이콘 사용 (프로젝트 표준)
- Card 컴포넌트 재사용

---

#### 3.4 리뷰 목록 컴포넌트
**파일**: `src/features/review/components/review-list.tsx` (신규)

**구현 내용**:
```typescript
'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useReviewsQuery } from '@/features/review/hooks/useReviewsQuery';
import { usePlaceDetailContext } from '@/features/place/context/place-detail-context';
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
  } = useReviewsQuery(placeId);

  const { ref, inView } = useInView();

  // 무한 스크롤 처리
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

      {/* 무한 스크롤 트리거 */}
      {hasNextPage && (
        <div ref={ref} className="py-4">
          {isFetchingNextPage && <Skeleton className="h-32 w-full" />}
        </div>
      )}
    </div>
  );
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (신규 파일)

**DRY 준수**:
- `useReviewsQuery` 훅 재사용 (공통 모듈)
- react-intersection-observer 라이브러리 활용
- 무한 스크롤 패턴 재사용 가능

**필요한 패키지**:
```bash
npm install react-intersection-observer
```

---

#### 3.5 리뷰 아이템 컴포넌트
**파일**: `src/features/review/components/review-item.tsx` (신규)

**구현 내용**:
```typescript
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Review } from '@/features/review/lib/dto';

interface ReviewItemProps {
  review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{review.authorName}</span>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {format(new Date(review.createdAt), 'PPP', { locale: ko })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{review.content}</p>
      </CardContent>
    </Card>
  );
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (신규 파일)

**DRY 준수**:
- date-fns 라이브러리 사용 (프로젝트 표준)
- 별점 렌더링 로직 (향후 공통 컴포넌트로 추출 가능)
- Card 컴포넌트 재사용

---

#### 3.6 리뷰 작성 버튼 컴포넌트
**파일**: `src/features/review/components/review-write-button.tsx` (신규)

**구현 내용**:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface ReviewWriteButtonProps {
  placeId: string;
}

export function ReviewWriteButton({ placeId }: ReviewWriteButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/place/${placeId}/review`);
  };

  return (
    <Button
      onClick={handleClick}
      className="mt-4 w-full"
      size="lg"
    >
      <PlusCircle className="mr-2 h-5 w-5" />
      리뷰 작성
    </Button>
  );
}
```

**기존 코드와의 충돌 여부**: ❌ 없음 (신규 파일)

**DRY 준수**:
- Button 컴포넌트 재사용
- Next.js router 사용 (프로젝트 표준)

---

### Phase 4: 통합 및 테스트

#### 4.1 페이지 통합 체크리스트
- [ ] 페이지 레이아웃 정상 렌더링
- [ ] 장소 정보 API 호출 및 표시
- [ ] 리뷰 목록 API 호출 및 표시
- [ ] 평점 요약 정상 계산
- [ ] 리뷰 작성 버튼 네비게이션
- [ ] 무한 스크롤 정상 동작
- [ ] 로딩 상태 표시
- [ ] 에러 상태 처리

#### 4.2 테스트 시나리오

**성공 케이스**:
1. 유효한 장소 ID로 접속 → 장소 정보 및 리뷰 표시
2. 리뷰가 많은 장소 → 무한 스크롤 동작 확인
3. 리뷰 작성 버튼 클릭 → 리뷰 작성 페이지 이동

**실패 케이스**:
1. 존재하지 않는 장소 ID → 404 에러 메시지
2. 네트워크 오류 → 에러 메시지 및 재시도
3. 리뷰 없는 장소 → 빈 상태 메시지

#### 4.3 성능 최적화
- [ ] React Query 캐싱 활용
- [ ] 컴포넌트 메모이제이션 (React.memo)
- [ ] 무한 스크롤 debounce 처리
- [ ] 이미지 lazy loading (향후 확장 시)

#### 4.4 접근성 검증
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원
- [ ] ARIA 라벨 추가
- [ ] 색상 대비 확인

---

## 4. 파일 구조 및 코드베이스 정합성

### 4.1 생성할 파일 목록

**페이지**:
- `src/app/place/[id]/page.tsx`

**컨텍스트**:
- `src/features/place/context/place-detail-context.tsx`

**컴포넌트**:
- `src/features/place/components/place-info-card.tsx`
- `src/features/review/components/rating-summary.tsx`
- `src/features/review/components/review-list.tsx`
- `src/features/review/components/review-item.tsx`
- `src/features/review/components/review-write-button.tsx`

### 4.2 의존하는 공통 모듈 (Phase 0에서 구현됨)

**백엔드**:
- `src/features/place/backend/route.ts`
- `src/features/place/backend/service.ts`
- `src/features/place/backend/schema.ts`
- `src/features/review/backend/route.ts`
- `src/features/review/backend/service.ts`
- `src/features/review/backend/schema.ts`

**프론트엔드**:
- `src/features/place/hooks/usePlaceQuery.ts`
- `src/features/review/hooks/useReviewsQuery.ts`
- `src/features/place/lib/dto.ts`
- `src/features/review/lib/dto.ts`

### 4.3 코드베이스 구조 준수 확인

**✅ 디렉토리 구조**:
```
src/
├── app/
│   └── place/
│       └── [id]/
│           └── page.tsx         # 새로 생성
├── features/
│   ├── place/
│   │   ├── backend/             # Phase 0에서 생성됨
│   │   ├── context/
│   │   │   └── place-detail-context.tsx  # 새로 생성
│   │   ├── components/
│   │   │   └── place-info-card.tsx       # 새로 생성
│   │   ├── hooks/               # Phase 0에서 생성됨
│   │   └── lib/                 # Phase 0에서 생성됨
│   └── review/
│       ├── backend/             # Phase 0에서 생성됨
│       ├── components/
│       │   ├── rating-summary.tsx        # 새로 생성
│       │   ├── review-list.tsx           # 새로 생성
│       │   ├── review-item.tsx           # 새로 생성
│       │   └── review-write-button.tsx   # 새로 생성
│       ├── hooks/               # Phase 0에서 생성됨
│       └── lib/                 # Phase 0에서 생성됨
```

**✅ 네이밍 컨벤션**:
- 페이지: `page.tsx`
- 컨텍스트: `*-context.tsx`
- 컴포넌트: `kebab-case.tsx`
- 훅: `use*.ts`

**✅ 타입스크립트 패턴**:
- Props 인터페이스 명명: `*Props`
- 컴포넌트 export: named export
- 타입 재노출: `lib/dto.ts`

---

## 5. DRY 원칙 준수 검증

### 5.1 재사용 가능한 로직
- **✅ React Query 훅**: `usePlaceQuery`, `useReviewsQuery`는 다른 페이지에서도 재사용
- **✅ Context 패턴**: 상태 관리 로직 중앙화, props drilling 제거
- **✅ shadcn-ui 컴포넌트**: Card, Button, Skeleton 등 재사용
- **✅ 별점 렌더링**: 향후 `RatingStars` 공통 컴포넌트로 추출 가능

### 5.2 중복 방지
- **❌ 중복 API 호출 방지**: React Query 캐싱 활용
- **❌ 중복 상태 관리 방지**: Context로 단일 진실의 원천 유지
- **❌ 중복 로딩/에러 처리 방지**: 공통 패턴 사용

---

## 6. 추가 필요 사항

### 6.1 필요한 shadcn-ui 컴포넌트
```bash
npx shadcn@latest add card
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add button
```

### 6.2 필요한 npm 패키지
```bash
npm install react-intersection-observer
```

### 6.3 환경 변수 확인
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 7. 에러 처리 및 엣지케이스

### 7.1 장소 없음 (404)
**발생 조건**: 존재하지 않는 장소 ID
**처리 방법**:
```typescript
// src/app/place/[id]/page.tsx에 추가
if (!place && !isLoading) {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold mb-4">장소를 찾을 수 없습니다</h1>
      <Button onClick={() => router.push('/')}>홈으로 돌아가기</Button>
    </div>
  );
}
```

### 7.2 네트워크 오류
**발생 조건**: API 호출 실패
**처리 방법**: React Query의 자동 재시도 + 에러 메시지 표시

### 7.3 리뷰 없음
**발생 조건**: 해당 장소에 리뷰가 없음
**처리 방법**: 빈 상태 UI 표시 (ReviewList 컴포넌트 참고)

### 7.4 유효하지 않은 UUID
**발생 조건**: 잘못된 형식의 장소 ID
**처리 방법**: 백엔드에서 Zod 스키마 검증 → 400 에러 반환

---

## 8. 성능 최적화 전략

### 8.1 초기 로딩 최적화
- 장소 정보와 리뷰 목록 병렬 조회
- React Query 캐싱으로 중복 요청 방지
- Skeleton UI로 로딩 체감 시간 단축

### 8.2 무한 스크롤 최적화
- IntersectionObserver로 효율적인 스크롤 감지
- React Query의 `fetchNextPage`로 자동 페이지네이션
- 이미 로드된 데이터 재사용

### 8.3 렌더링 최적화
- React.memo로 불필요한 리렌더링 방지
- useMemo, useCallback으로 참조 안정성 확보
- Context 값 메모이제이션

---

## 9. 향후 확장 가능성

### 9.1 현재는 구현하지 않을 기능 (오버엔지니어링 방지)
- ❌ 리뷰 이미지 업로드
- ❌ 리뷰 좋아요/신고
- ❌ 리뷰 답글 기능
- ❌ 장소 즐겨찾기
- ❌ 리뷰 필터링 (평점별, 최신순 외)

### 9.2 향후 추가 가능한 기능
- ✅ 리뷰 수정/삭제 (다른 페이지에서 구현)
- ✅ 리뷰 작성 (다른 페이지에서 구현)
- ✅ 지도 연동 (홈 페이지에서 구현)

---

## 10. 구현 완료 체크리스트

### Phase 1: 백엔드 검증
- [ ] 장소 조회 API 동작 확인
- [ ] 리뷰 목록 조회 API 동작 확인
- [ ] 페이지네이션 동작 확인
- [ ] 에러 응답 검증

### Phase 2: 상태관리
- [ ] PlaceDetailContext 구현
- [ ] PlaceDetailProvider 구현
- [ ] usePlaceDetailContext 훅 구현
- [ ] Reducer 테스트

### Phase 3: UI 컴포넌트
- [ ] 페이지 레이아웃 구현
- [ ] PlaceInfoCard 구현
- [ ] RatingSummary 구현
- [ ] ReviewList 구현
- [ ] ReviewItem 구현
- [ ] ReviewWriteButton 구현

### Phase 4: 통합 테스트
- [ ] 전체 플로우 테스트
- [ ] 에러 케이스 테스트
- [ ] 성능 최적화 적용
- [ ] 접근성 검증

### 최종 검증
- [ ] ESLint 오류 없음
- [ ] TypeScript 타입 오류 없음
- [ ] 빌드 성공
- [ ] 모든 페이지 정상 동작

---

## 11. 변경 이력

| 날짜 | 버전 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 2025-10-23 | 1.0.0 | AI Agent | 초기 작성 |

---

## 부록: 참고 문서

- [PRD](/docs/prd.md)
- [Userflow](/docs/userflow.md)
- [Database 설계](/docs/database.md)
- [공통 모듈 설계](/docs/common-modules.md)
- [UC-003 유스케이스](/docs/usecases/3-place-detail/spec.md)
- [상태관리 설계](/docs/pages/3-place-detail/state.md)

---

**문서 작성 완료**

이 계획서는 장소 상세 페이지의 엄밀한 구현 계획을 제공합니다. 기존 코드베이스 구조를 철저히 준수하고, DRY 원칙을 따르며, 문서에 명시된 기능만 구현합니다. Phase 0 (공통 모듈)이 완료된 후 이 계획에 따라 구현하면 충돌 없이 안전하게 개발할 수 있습니다.
