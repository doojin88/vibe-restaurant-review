# 4-review-write 페이지 구현 계획

## 문서 개요
이 문서는 리뷰 작성 페이지(`/place/[id]/review`)의 단계별 구현 계획을 정의합니다.
PRD, Userflow, Database, Common Modules, Usecase, State Management 문서를 기반으로 작성되었습니다.

**최종 업데이트**: 2025-10-23
**작성자**: AI Agent
**버전**: 1.0.0

---

## 1. 현재 프로젝트 상태 분석

### 1.1 기존 구현 상태

#### 백엔드 인프라
- ✅ Hono 앱 기본 구조 (`src/backend/hono/app.ts`)
- ✅ 미들웨어 (errorBoundary, withAppContext, withSupabase)
- ✅ 예시 라우터 구조 (`src/features/example/backend/`)
- ❌ place, review 기능 모듈 미구현

#### 프론트엔드 인프라
- ✅ Next.js 15 App Router 구조
- ✅ shadcn-ui 컴포넌트 (button, card, form, input, textarea, label, separator, sheet, toast 등)
- ✅ React Query 설정 (providers.tsx)
- ❌ 지도 SDK 미설정
- ❌ place, review 관련 훅 미구현
- ❌ 공통 상태 관리 스토어 미구현

#### 데이터베이스
- ✅ Supabase 기본 설정
- ❌ places, reviews 테이블 미생성
- ❌ 시드 데이터 미생성

### 1.2 누락된 공통 모듈

**우선순위 P0 (필수)**:
1. 데이터베이스 마이그레이션 (places, reviews 테이블)
2. Backend 기능 모듈 (place, review)
3. Frontend 데이터 페칭 훅 (usePlaceQuery, useCreateReviewMutation)
4. API 클라이언트 baseURL 설정
5. 필수 shadcn-ui 컴포넌트 (alert-dialog, skeleton)

**우선순위 P1 (권장)**:
1. 공통 에러 처리 컴포넌트
2. 공통 로딩 스피너 컴포넌트

### 1.3 코드베이스 구조 확인

**디렉토리 구조**:
```
src/
├── app/                      # Next.js App Router
│   ├── api/[[...hono]]/     # Hono 엔드포인트
│   └── place/[id]/review/   # ❌ 리뷰 작성 페이지 (미구현)
├── backend/
│   ├── hono/                # ✅ Hono 앱 기본 구조
│   ├── middleware/          # ✅ 공통 미들웨어
│   └── config/              # ✅ 환경 변수 파싱
├── features/
│   ├── example/             # ✅ 예시 기능 모듈
│   ├── place/               # ❌ 장소 기능 모듈 (미구현)
│   └── review/              # ❌ 리뷰 기능 모듈 (미구현)
├── components/
│   └── ui/                  # ✅ shadcn-ui 컴포넌트
└── lib/
    ├── remote/              # ✅ API 클라이언트
    └── utils.ts             # ✅ 유틸리티 함수
```

---

## 2. 구현 단계 정의

### Phase 0: 사전 준비 (공통 모듈 구현)

**목표**: 리뷰 작성 페이지 개발에 필요한 공통 모듈 구현
**예상 소요 시간**: 4-6시간

#### Step 0.1: 데이터베이스 마이그레이션

**작업 내용**:
1. `supabase/migrations/0002_create_places_table.sql` 생성
   - places 테이블 생성
   - 위치 기반 인덱스 생성
   - 이름 검색 인덱스 생성
   - RLS 비활성화

2. `supabase/migrations/0003_create_reviews_table.sql` 생성
   - reviews 테이블 생성
   - place_id 외래키 설정
   - 평점, 내용 제약조건 설정
   - 인덱스 생성 (place_id, created_at)
   - RLS 비활성화

3. `supabase/migrations/0004_seed_places.sql` 생성
   - 테스트용 장소 데이터 3개 추가

**주의사항**:
- 각 마이그레이션은 `IF NOT EXISTS` 사용하여 멱등성 보장
- Database 설계 문서의 SQL을 그대로 사용
- 예시 테이블(example) 제거하지 않음 (기존 코드와의 충돌 방지)

**검증 방법**:
- Supabase Dashboard에서 테이블 생성 확인
- 시드 데이터 조회 확인

---

#### Step 0.2: Backend - Place 기능 모듈 구현

**작업 내용**:

1. **Schema 정의** (`src/features/place/backend/schema.ts`)
```typescript
import { z } from 'zod';

// 장소 기본 스키마
export const PlaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  category: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.string().datetime(),
});

// 장소 상세 스키마 (평점 포함)
export const PlaceDetailSchema = PlaceSchema.extend({
  averageRating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
});

// 장소 조회 요청 스키마
export const GetPlaceParamsSchema = z.object({
  id: z.string().uuid(),
});

export type Place = z.infer<typeof PlaceSchema>;
export type PlaceDetail = z.infer<typeof PlaceDetailSchema>;
export type GetPlaceParams = z.infer<typeof GetPlaceParamsSchema>;
```

2. **Error 코드 정의** (`src/features/place/backend/error.ts`)
```typescript
export const PlaceErrorCode = {
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
  PLACE_FETCH_FAILED: 'PLACE_FETCH_FAILED',
} as const;

export type PlaceErrorCode = typeof PlaceErrorCode[keyof typeof PlaceErrorCode];
```

3. **Service 구현** (`src/features/place/backend/service.ts`)
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure } from '@/backend/http/response';
import type { PlaceDetail } from './schema';
import { PlaceErrorCode } from './error';

export const PlaceService = {
  async getPlaceById(
    supabase: SupabaseClient,
    placeId: string
  ) {
    // 1. 장소 기본 정보 조회
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      return failure(
        PlaceErrorCode.PLACE_NOT_FOUND,
        '장소를 찾을 수 없습니다.'
      );
    }

    // 2. 평균 평점 및 리뷰 개수 계산
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('place_id', placeId);

    if (reviewError) {
      return failure(
        PlaceErrorCode.PLACE_FETCH_FAILED,
        '장소 정보 조회에 실패했습니다.'
      );
    }

    const reviewCount = reviews?.length ?? 0;
    const averageRating = reviewCount > 0
      ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

    const placeDetail: PlaceDetail = {
      id: place.id,
      name: place.name,
      address: place.address,
      category: place.category,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      createdAt: place.created_at,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount,
    };

    return success(placeDetail);
  },
};
```

4. **Route 구현** (`src/features/place/backend/route.ts`)
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { PlaceService } from './service';
import { GetPlaceParamsSchema } from './schema';

export function registerPlaceRoutes(app: Hono<AppEnv>) {
  const router = new Hono<AppEnv>();

  // GET /api/places/:id
  router.get(
    '/:id',
    zValidator('param', GetPlaceParamsSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const supabase = c.get('supabase');

      const result = await PlaceService.getPlaceById(supabase, id);

      if (!result.ok) {
        return c.json(result, 404);
      }

      return c.json({ ok: true, data: { place: result.data } });
    }
  );

  app.route('/api/places', router);
}
```

5. **DTO 재노출** (`src/features/place/lib/dto.ts`)
```typescript
export {
  PlaceSchema,
  PlaceDetailSchema,
  type Place,
  type PlaceDetail,
} from '../backend/schema';
```

**주의사항**:
- Supabase 쿼리 결과는 `as unknown as Type` 패턴 사용
- 항상 `error`와 `!data` 체크
- 평균 평점은 소수점 1자리로 반올림

**검증 방법**:
- Hono 앱에 라우터 등록 후 API 호출 테스트
- 존재하는 장소 ID로 GET 요청 → 200 응답
- 존재하지 않는 장소 ID로 GET 요청 → 404 응답

---

#### Step 0.3: Backend - Review 기능 모듈 구현

**작업 내용**:

1. **Schema 정의** (`src/features/review/backend/schema.ts`)
```typescript
import { z } from 'zod';

// 리뷰 기본 스키마
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  placeId: z.string().uuid(),
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string(),
  createdAt: z.string().datetime(),
});

// 리뷰 작성 요청 스키마
export const CreateReviewSchema = z.object({
  authorName: z
    .string()
    .email('이메일 형식이 아닙니다.')
    .max(20, '작성자명은 최대 20자입니다.'),
  rating: z
    .number()
    .int()
    .min(1, '평점은 최소 1점입니다.')
    .max(5, '평점은 최대 5점입니다.'),
  content: z
    .string()
    .min(10, '리뷰 내용은 최소 10자입니다.')
    .max(500, '리뷰 내용은 최대 500자입니다.'),
  password: z
    .string()
    .min(4, '비밀번호는 최소 4자입니다.'),
});

// 리뷰 작성 응답 스키마
export const CreateReviewResponseSchema = z.object({
  id: z.string().uuid(),
  authorName: z.string(),
  rating: z.number(),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export type Review = z.infer<typeof ReviewSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type CreateReviewResponse = z.infer<typeof CreateReviewResponseSchema>;
```

2. **Error 코드 정의** (`src/features/review/backend/error.ts`)
```typescript
export const ReviewErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
  REVIEW_CREATE_FAILED: 'REVIEW_CREATE_FAILED',
  PASSWORD_HASH_FAILED: 'PASSWORD_HASH_FAILED',
} as const;

export type ReviewErrorCode = typeof ReviewErrorCode[keyof typeof ReviewErrorCode];
```

3. **Service 구현** (`src/features/review/backend/service.ts`)
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { success, failure } from '@/backend/http/response';
import type { CreateReviewInput, CreateReviewResponse } from './schema';
import { ReviewErrorCode } from './error';

export const ReviewService = {
  async createReview(
    supabase: SupabaseClient,
    placeId: string,
    input: CreateReviewInput
  ) {
    // 1. 장소 존재 여부 확인
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('id')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      return failure(
        ReviewErrorCode.PLACE_NOT_FOUND,
        '장소를 찾을 수 없습니다.'
      );
    }

    // 2. 비밀번호 해싱
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(input.password, 10);
    } catch (error) {
      return failure(
        ReviewErrorCode.PASSWORD_HASH_FAILED,
        '비밀번호 처리 중 오류가 발생했습니다.'
      );
    }

    // 3. 리뷰 저장
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        place_id: placeId,
        author_name: input.authorName,
        rating: input.rating,
        content: input.content,
        password_hash: passwordHash,
      })
      .select('id, author_name, rating, content, created_at')
      .single();

    if (reviewError || !review) {
      return failure(
        ReviewErrorCode.REVIEW_CREATE_FAILED,
        '리뷰 작성에 실패했습니다.'
      );
    }

    const response: CreateReviewResponse = {
      id: review.id,
      authorName: review.author_name,
      rating: review.rating,
      content: review.content,
      createdAt: review.created_at,
    };

    return success(response);
  },
};
```

4. **Route 구현** (`src/features/review/backend/route.ts`)
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { ReviewService } from './service';
import { CreateReviewSchema } from './schema';
import { z } from 'zod';

export function registerReviewRoutes(app: Hono<AppEnv>) {
  const router = new Hono<AppEnv>();

  // POST /api/places/:placeId/reviews
  router.post(
    '/:placeId/reviews',
    zValidator('param', z.object({ placeId: z.string().uuid() })),
    zValidator('json', CreateReviewSchema),
    async (c) => {
      const { placeId } = c.req.valid('param');
      const input = c.req.valid('json');
      const supabase = c.get('supabase');

      const result = await ReviewService.createReview(
        supabase,
        placeId,
        input
      );

      if (!result.ok) {
        const statusCode = result.error.code === 'PLACE_NOT_FOUND' ? 404 : 500;
        return c.json(result, statusCode);
      }

      return c.json({ ok: true, data: { review: result.data } });
    }
  );

  app.route('/api/places', router);
}
```

5. **DTO 재노출** (`src/features/review/lib/dto.ts`)
```typescript
export {
  ReviewSchema,
  CreateReviewSchema,
  CreateReviewResponseSchema,
  type Review,
  type CreateReviewInput,
  type CreateReviewResponse,
} from '../backend/schema';
```

**주의사항**:
- bcrypt 패키지 설치 필요: `npm install bcryptjs @types/bcryptjs`
- 비밀번호는 절대 평문으로 저장하지 않음
- Supabase 오류는 명확한 에러 메시지로 변환

**검증 방법**:
- API 호출 테스트 (Postman 또는 curl)
- 유효한 데이터로 POST → 201 응답
- 유효하지 않은 데이터로 POST → 400 응답
- 존재하지 않는 장소 ID로 POST → 404 응답

---

#### Step 0.4: Hono 앱에 라우터 등록

**작업 내용**:

`src/backend/hono/app.ts` 수정:
```typescript
import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerPlaceRoutes } from '@/features/place/backend/route'; // 추가
import { registerReviewRoutes } from '@/features/review/backend/route'; // 추가
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerPlaceRoutes(app); // 추가
  registerReviewRoutes(app); // 추가

  singletonApp = app;

  return app;
};
```

**주의사항**:
- 기존 example 라우터는 유지
- 라우터 등록 순서 무관 (각 라우터가 독립적인 경로 사용)

**검증 방법**:
- `npm run dev` 실행
- API 엔드포인트 호출 테스트

---

#### Step 0.5: Frontend - 데이터 페칭 훅 구현

**작업 내용**:

1. **API 클라이언트 설정 확인** (`src/lib/remote/api-client.ts`)
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api', // 확인 필요
  headers: {
    'Content-Type': 'application/json',
  },
});
```

2. **Place Query 훅** (`src/features/place/hooks/usePlaceQuery.ts`)
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { PlaceDetailSchema, type PlaceDetail } from '../lib/dto';

export function usePlaceQuery(placeId: string) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/places/${placeId}`);

      if (!data.ok) {
        throw new Error(data.error?.message ?? '장소 조회 실패');
      }

      return PlaceDetailSchema.parse(data.data.place);
    },
    enabled: !!placeId,
    retry: (failureCount, error) => {
      // 404는 재시도 안 함
      if (error.message.includes('NOT_FOUND')) return false;
      return failureCount < 3;
    },
  });
}
```

3. **Review Mutation 훅** (`src/features/review/hooks/useCreateReviewMutation.ts`)
```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  CreateReviewSchema,
  CreateReviewResponseSchema,
  type CreateReviewInput,
} from '../lib/dto';

export function useCreateReviewMutation(placeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      // 클라이언트 사이드 검증
      CreateReviewSchema.parse(input);

      const { data } = await apiClient.post(
        `/places/${placeId}/reviews`,
        input
      );

      if (!data.ok) {
        throw new Error(data.error?.message ?? '리뷰 작성 실패');
      }

      return CreateReviewResponseSchema.parse(data.data.review);
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['place', placeId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', placeId] });
    },
  });
}
```

**주의사항**:
- 모든 컴포넌트/훅은 `'use client'` 지시자 필수
- Zod 스키마로 응답 데이터 검증
- React Query 캐시 전략 명확히 설정

**검증 방법**:
- 간단한 테스트 페이지에서 훅 호출
- 데이터 페칭 성공 확인
- 에러 처리 정상 동작 확인

---

#### Step 0.6: 필수 shadcn-ui 컴포넌트 설치

**작업 내용**:

다음 컴포넌트들이 누락되어 있으면 설치:
```bash
npx shadcn@latest add alert-dialog
npx shadcn@latest add skeleton
```

**검증 방법**:
- `src/components/ui/` 디렉토리에 파일 존재 확인

---

### Phase 1: 리뷰 작성 페이지 구현

**목표**: 리뷰 작성 페이지 UI 및 로직 구현
**예상 소요 시간**: 4-6시간

#### Step 1.1: 페이지 라우트 생성

**작업 내용**:

1. 디렉토리 생성:
```bash
mkdir -p src/app/place/[id]/review
```

2. `src/app/place/[id]/review/page.tsx` 생성:
```typescript
'use client';

import { use } from 'react';
import { ReviewWriteProvider } from '@/features/review/context/review-write-context';
import { ReviewWriteForm } from '@/features/review/components/review-write-form';

export default function ReviewWritePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ReviewWriteProvider placeId={id}>
      <ReviewWriteForm />
    </ReviewWriteProvider>
  );
}
```

**주의사항**:
- Next.js 15에서 params는 Promise 타입
- `use()` 훅으로 Promise 언랩
- `'use client'` 지시자 필수

---

#### Step 1.2: Context 및 Reducer 구현

**작업 내용**:

1. **State 타입 정의** (`src/features/review/context/review-write-types.ts`)
```typescript
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
```

2. **Reducer 구현** (`src/features/review/context/review-write-reducer.ts`)
```typescript
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
```

3. **Context Provider 구현** (`src/features/review/context/review-write-context.tsx`)
```typescript
'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlaceQuery } from '@/features/place/hooks/usePlaceQuery';
import { useCreateReviewMutation } from '@/features/review/hooks/useCreateReviewMutation';
import { CreateReviewSchema } from '@/features/review/lib/dto';
import { reviewWriteReducer, initialState } from './review-write-reducer';
import type { ReviewWriteState, ReviewWriteAction } from './review-write-types';
import { useToast } from '@/components/ui/use-toast';

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

  // 장소 정보 로딩
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
  }, []);

  const setRating = useCallback((rating: number) => {
    dispatch({ type: 'SET_RATING', payload: rating });
  }, []);

  const setContent = useCallback((content: string) => {
    dispatch({ type: 'SET_CONTENT', payload: content });
  }, []);

  const setPassword = useCallback((password: string) => {
    dispatch({ type: 'SET_PASSWORD', payload: password });
  }, []);

  const validateForm = useCallback(() => {
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

      // 장소 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/place/${placeId}`);
      }, 1000);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '리뷰 작성에 실패했습니다.';

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
```

**주의사항**:
- Context는 절대 null이 되어서는 안 됨
- useCallback으로 불필요한 리렌더링 방지
- 폼 검증은 실시간 + 제출 시 이중으로 수행

---

#### Step 1.3: 폼 컴포넌트 구현

**작업 내용**:

1. **메인 폼 컴포넌트** (`src/features/review/components/review-write-form.tsx`)
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { useReviewWriteContext } from '../context/review-write-context';
import { ReviewFormFields } from './review-form-fields';
import { ReviewPlaceInfo } from './review-place-info';
import { ReviewBackConfirmDialog } from './review-back-confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ReviewWriteForm() {
  const {
    state,
    submitForm,
    openBackConfirm,
  } = useReviewWriteContext();

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
```

2. **폼 필드 컴포넌트** (`src/features/review/components/review-form-fields.tsx`)
```typescript
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReviewWriteContext } from '../context/review-write-context';

export function ReviewFormFields() {
  const {
    state,
    setAuthorName,
    setRating,
    setContent,
    setPassword,
    getCharacterCount,
    getRemainingCharacters,
  } = useReviewWriteContext();

  return (
    <>
      {/* 작성자명 */}
      <div className="space-y-2">
        <Label htmlFor="authorName">
          작성자명 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="authorName"
          type="email"
          placeholder="email@example.com"
          value={state.authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={20}
          disabled={state.submitting}
        />
        {state.authorNameError && (
          <p className="text-sm text-red-500">{state.authorNameError}</p>
        )}
      </div>

      {/* 평점 */}
      <div className="space-y-2">
        <Label>
          평점 <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              disabled={state.submitting}
              className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
            >
              <Star
                className={cn(
                  'h-8 w-8',
                  star <= state.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
        {state.ratingError && (
          <p className="text-sm text-red-500">{state.ratingError}</p>
        )}
      </div>

      {/* 리뷰 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content">
          리뷰 내용 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          placeholder="방문하신 장소에 대한 경험을 자유롭게 작성해주세요. (최소 10자)"
          value={state.content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={5}
          disabled={state.submitting}
        />
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">최소 10자, 최대 500자</span>
          <span
            className={cn(
              getCharacterCount() > 500
                ? 'text-red-500'
                : 'text-gray-500'
            )}
          >
            {getCharacterCount()} / 500
          </span>
        </div>
        {state.contentError && (
          <p className="text-sm text-red-500">{state.contentError}</p>
        )}
      </div>

      {/* 비밀번호 */}
      <div className="space-y-2">
        <Label htmlFor="password">
          비밀번호 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="수정/삭제 시 사용할 비밀번호 (최소 4자)"
          value={state.password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={state.submitting}
        />
        <p className="text-sm text-gray-500">
          리뷰 수정/삭제 시 필요합니다. 잊지 말아주세요!
        </p>
        {state.passwordError && (
          <p className="text-sm text-red-500">{state.passwordError}</p>
        )}
      </div>
    </>
  );
}
```

3. **장소 정보 컴포넌트** (`src/features/review/components/review-place-info.tsx`)
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import type { PlaceDetail } from '@/features/place/lib/dto';

interface ReviewPlaceInfoProps {
  place: PlaceDetail;
}

export function ReviewPlaceInfo({ place }: ReviewPlaceInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {place.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-gray-600">{place.address}</p>
        <p className="text-sm text-gray-500">{place.category}</p>
      </CardContent>
    </Card>
  );
}
```

4. **뒤로가기 확인 다이얼로그** (`src/features/review/components/review-back-confirm-dialog.tsx`)
```typescript
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useReviewWriteContext } from '../context/review-write-context';

export function ReviewBackConfirmDialog() {
  const { state, closeBackConfirm, confirmBack } = useReviewWriteContext();

  return (
    <AlertDialog open={state.backConfirm} onOpenChange={closeBackConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>작성을 취소하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            작성 중인 내용이 있습니다. 정말 나가시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>계속 작성</AlertDialogCancel>
          <AlertDialogAction onClick={confirmBack}>나가기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**주의사항**:
- 모든 필드는 disabled 상태 지원
- 에러 메시지는 필드 하단에 표시
- 글자 수는 실시간으로 표시
- 별점은 클릭 시 시각적 피드백 제공

---

### Phase 2: 테스트 및 검증

**목표**: 구현된 기능의 정상 동작 검증
**예상 소요 시간**: 2-3시간

#### Step 2.1: 단위 테스트

**작업 내용**:
1. Reducer 함수 테스트
2. Context 훅 테스트
3. 폼 검증 로직 테스트

#### Step 2.2: 통합 테스트

**작업 내용**:
1. 폼 입력 플로우 테스트
2. 폼 제출 플로우 테스트
3. 뒤로가기 처리 테스트
4. 에러 처리 테스트

#### Step 2.3: E2E 테스트

**작업 내용**:
1. 사용자 시나리오 기반 테스트
2. 장소 조회 실패 시나리오
3. 리뷰 작성 성공 시나리오
4. 리뷰 작성 실패 시나리오

---

## 3. 기존 코드베이스와의 충돌 분석

### 3.1 충돌 가능성 검토

#### 백엔드
- ❌ **충돌 없음**: place, review 라우터는 새로운 경로 사용
- ❌ **충돌 없음**: 기존 example 라우터와 독립적

#### 프론트엔드
- ❌ **충돌 없음**: 새로운 페이지 경로 (`/place/[id]/review`)
- ❌ **충돌 없음**: 기존 auth 기능과 독립적 (비로그인 서비스)
- ⚠️ **주의 필요**: `src/lib/remote/api-client.ts`의 baseURL 확인 필요

#### 데이터베이스
- ❌ **충돌 없음**: 새로운 테이블 (places, reviews)
- ❌ **충돌 없음**: 기존 example 테이블과 독립적

### 3.2 주의해야 할 의존성

1. **bcryptjs 패키지**: 새로 설치 필요
2. **shadcn-ui 컴포넌트**: alert-dialog, skeleton 확인 필요
3. **환경 변수**: Supabase 설정 확인 필요

---

## 4. DRY 원칙 준수 전략

### 4.1 공통 로직 재사용

#### Backend
- `success`, `failure` 응답 헬퍼 재사용
- Supabase 클라이언트 주입 미들웨어 재사용
- 에러 바운더리 미들웨어 재사용

#### Frontend
- `apiClient` 재사용
- shadcn-ui 컴포넌트 재사용
- React Query 설정 재사용

### 4.2 중복 코드 방지

- Zod 스키마는 backend에서 정의 후 frontend에서 재노출
- 타입은 스키마에서 추론 (`z.infer`)
- 에러 메시지는 상수로 정의

---

## 5. 구현 순서 요약

### 우선순위 P0 (필수)
1. ✅ 데이터베이스 마이그레이션 (0.1)
2. ✅ Backend - Place 모듈 (0.2)
3. ✅ Backend - Review 모듈 (0.3)
4. ✅ Hono 라우터 등록 (0.4)
5. ✅ Frontend - 데이터 페칭 훅 (0.5)
6. ✅ 페이지 라우트 생성 (1.1)
7. ✅ Context 및 Reducer (1.2)
8. ✅ 폼 컴포넌트 (1.3)

### 우선순위 P1 (권장)
1. ⬜ 단위 테스트 (2.1)
2. ⬜ 통합 테스트 (2.2)
3. ⬜ E2E 테스트 (2.3)

---

## 6. 검증 체크리스트

### 백엔드 검증
- [ ] 데이터베이스 마이그레이션 정상 실행
- [ ] `GET /api/places/:id` 정상 동작
- [ ] `POST /api/places/:placeId/reviews` 정상 동작
- [ ] 에러 처리 정상 동작 (404, 400, 500)
- [ ] 비밀번호 bcrypt 해싱 정상 동작

### 프론트엔드 검증
- [ ] 페이지 라우트 정상 렌더링
- [ ] 장소 정보 로딩 정상 동작
- [ ] 폼 입력 정상 동작
- [ ] 실시간 검증 정상 동작
- [ ] 폼 제출 정상 동작
- [ ] 뒤로가기 확인 다이얼로그 정상 동작
- [ ] 성공 토스트 메시지 표시
- [ ] 장소 상세 페이지로 이동

### UI/UX 검증
- [ ] 로딩 스피너 표시
- [ ] 에러 메시지 표시
- [ ] 글자 수 실시간 표시
- [ ] 별점 시각적 피드백
- [ ] 제출 버튼 활성화/비활성화
- [ ] 반응형 디자인 적용

---

## 7. 예상 이슈 및 대응 방안

### 이슈 1: Supabase 타입 불일치
**증상**: Supabase 쿼리 결과 타입 에러
**대응**: `as unknown as Type` 패턴 사용

### 이슈 2: bcrypt 설치 오류
**증상**: bcryptjs 패키지 설치 실패
**대응**: `npm install bcryptjs @types/bcryptjs` 명령어 사용

### 이슈 3: shadcn-ui 컴포넌트 누락
**증상**: alert-dialog 또는 skeleton 컴포넌트 없음
**대응**: `npx shadcn@latest add [component-name]` 명령어 사용

### 이슈 4: Context null 에러
**증상**: useReviewWriteContext 호출 시 null 에러
**대응**: Provider로 감싸는지 확인, null 체크 강화

---

## 8. 성능 최적화 고려사항

### 8.1 렌더링 최적화
- `useCallback`으로 함수 메모이제이션
- `useMemo`로 계산된 값 메모이제이션
- `React.memo`로 불필요한 리렌더링 방지

### 8.2 네트워크 최적화
- React Query 캐싱 활용
- 폼 검증 디바운싱 (선택적)
- API 호출 최소화

### 8.3 사용자 경험 최적화
- 로딩 스켈레톤 사용
- 낙관적 업데이트 (선택적)
- 에러 재시도 메커니즘

---

## 9. 향후 확장 가능성

### 9.1 추가 기능
- 리뷰 이미지 업로드
- 리뷰 임시 저장
- 리뷰 템플릿

### 9.2 개선 사항
- 폼 자동 완성
- 리뷰 작성 가이드
- 리뷰 미리보기

---

## 10. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2025-10-23 | AI Agent | 초기 작성 |

---

**문서 작성 완료**

이 구현 계획은 PRD, Userflow, Database, Common Modules, Usecase, State Management 문서를 기반으로 작성되었으며, 기존 코드베이스와의 충돌을 최소화하고 DRY 원칙을 준수하도록 설계되었습니다.
