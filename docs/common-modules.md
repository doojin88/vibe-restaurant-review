# 공통 모듈 설계 문서

## 문서 개요
본 문서는 Restaurant Review 프로젝트의 페이지 단위 개발을 시작하기 전에 구현해야 할 공통 모듈들을 정의합니다. **오버엔지니어링을 철저히 배제**하고, 문서에 명시된 기능만을 위한 최소한의 공통 모듈을 설계합니다.

---

## 설계 원칙

1. **최소주의**: PRD, Userflow, Database 문서에 명시된 기능만 구현
2. **병렬 개발 지원**: 페이지 단위 개발 시 코드 충돌 방지
3. **재사용성**: 여러 페이지에서 공통으로 사용되는 로직만 추출
4. **확장성**: 향후 기능 추가 시 쉽게 확장 가능한 구조

---

## 1. 백엔드 공통 모듈

### 1.1 데이터베이스 마이그레이션
**우선순위**: P0 (최우선)

**구현 내용**:
- `supabase/migrations/0001_create_places_table.sql`
- `supabase/migrations/0002_create_reviews_table.sql`  
- `supabase/migrations/0003_seed_places.sql`

**이유**: 모든 페이지에서 장소/리뷰 데이터를 사용하므로 최우선 구현 필요

### 1.2 백엔드 기능 모듈
**우선순위**: P0

**구현 내용**:
```
src/features/place/backend/
├── route.ts          # 장소 관련 API 라우터
├── service.ts        # 장소 비즈니스 로직
├── schema.ts         # 장소 요청/응답 스키마
└── error.ts          # 장소 에러 코드

src/features/review/backend/
├── route.ts          # 리뷰 관련 API 라우터  
├── service.ts        # 리뷰 비즈니스 로직
├── schema.ts         # 리뷰 요청/응답 스키마
└── error.ts          # 리뷰 에러 코드
```

**이유**: 모든 페이지에서 사용되는 API 엔드포인트이므로 공통 구현 필요

### 1.3 Hono 앱 라우터 등록
**우선순위**: P0

**구현 내용**:
- `src/backend/hono/app.ts`에서 place, review 라우터 등록
- 기존 example 라우터 제거

**이유**: API 엔드포인트가 정상 동작하려면 라우터 등록 필수

---

## 2. 프론트엔드 공통 모듈

### 2.1 API 클라이언트 설정
**우선순위**: P0

**구현 내용**:
- `src/lib/remote/api-client.ts` 수정
- baseURL을 `/api`로 변경 (기존 `NEXT_PUBLIC_API_BASE_URL` 제거)

**이유**: 모든 페이지에서 API 호출 시 사용되는 공통 클라이언트

### 2.2 공통 훅 (Hooks)
**우선순위**: P0

**구현 내용**:
```
src/features/place/hooks/
├── usePlaceQuery.ts           # 장소 조회 훅
├── usePlacesSearchQuery.ts    # 장소 검색 훅
└── usePlacesNearbyQuery.ts    # 주변 장소 조회 훅

src/features/review/hooks/
├── useReviewsQuery.ts         # 리뷰 목록 조회 훅
├── useCreateReviewMutation.ts # 리뷰 작성 뮤테이션
├── useUpdateReviewMutation.ts # 리뷰 수정 뮤테이션
└── useDeleteReviewMutation.ts # 리뷰 삭제 뮤테이션
```

**이유**: 모든 페이지에서 데이터 페칭에 사용되는 공통 훅

### 2.3 DTO (Data Transfer Object)
**우선순위**: P0

**구현 내용**:
```
src/features/place/lib/dto.ts    # 장소 관련 타입 재노출
src/features/review/lib/dto.ts    # 리뷰 관련 타입 재노출
```

**이유**: 프론트엔드에서 백엔드 스키마를 안전하게 사용하기 위함

### 2.4 공통 상태 관리
**우선순위**: P0

**구현 내용**:
```
src/stores/
├── map-store.ts      # 지도 상태 (중심 좌표, 줌 레벨)
└── search-store.ts   # 검색 상태 (키워드, 결과)
```

**이유**: 지도와 검색 기능은 여러 페이지에서 공유되는 상태

### 2.5 공통 유틸리티
**우선순위**: P0

**구현 내용**:
```
src/lib/
├── utils.ts           # 기존 유틸리티 (cn 함수 등)
├── validation.ts      # 공통 검증 함수
├── formatting.ts      # 날짜, 평점 포맷팅 함수
└── constants.ts       # 공통 상수
```

**이유**: 여러 페이지에서 공통으로 사용되는 유틸리티 함수들

---

## 3. UI 공통 모듈

### 3.1 shadcn-ui 컴포넌트 설치
**우선순위**: P0

**필요한 컴포넌트**:
```bash
npx shadcn@latest add card
npx shadcn@latest add sheet  
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add alert-dialog
npx shadcn@latest add badge
npx shadcn@latest add separator
```

**이유**: 모든 페이지에서 사용되는 UI 컴포넌트들

### 3.2 공통 컴포넌트
**우선순위**: P1

**구현 내용**:
```
src/components/common/
├── loading-spinner.tsx    # 로딩 스피너
├── error-boundary.tsx     # 에러 바운더리
├── empty-state.tsx        # 빈 상태 UI
└── page-header.tsx        # 페이지 헤더
```

**이유**: 여러 페이지에서 공통으로 사용되는 UI 컴포넌트들

### 3.3 지도 관련 컴포넌트
**우선순위**: P0

**구현 내용**:
```
src/components/map/
├── map-container.tsx      # 지도 컨테이너
├── map-marker.tsx         # 지도 마커
├── map-controls.tsx       # 지도 컨트롤
└── current-location.tsx   # 현재 위치 마커
```

**이유**: 지도 기능은 홈 화면과 장소 상세에서 공통 사용

---

## 4. 외부 서비스 연동

### 4.1 지도 SDK 설정
**우선순위**: P0

**구현 내용**:
- Kakao Map API 또는 Naver Map API 설정
- 환경 변수 추가: `NEXT_PUBLIC_MAP_API_KEY`
- 지도 SDK 초기화 유틸리티

**이유**: 지도 기능은 핵심 기능이므로 최우선 구현

### 4.2 위치 서비스
**우선순위**: P0

**구현 내용**:
```
src/lib/location/
├── geolocation.ts         # Geolocation API 래퍼
├── location-utils.ts      # 위치 관련 유틸리티
└── location-types.ts      # 위치 관련 타입
```

**이유**: 현재 위치 기반 기능은 핵심 기능

---

## 5. 환경 설정

### 5.1 환경 변수
**우선순위**: P0

**필요한 환경 변수**:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 지도 API
NEXT_PUBLIC_MAP_API_KEY=
```

### 5.2 TypeScript 설정
**우선순위**: P0

**구현 내용**:
- 공통 타입 정의: `src/types/`
- 환경 변수 타입: `src/types/env.ts`
- API 응답 타입: `src/types/api.ts`

---

## 6. 구현 순서

### Phase 1: 백엔드 기반 (1일)
1. 데이터베이스 마이그레이션 실행
2. 백엔드 기능 모듈 구현
3. Hono 라우터 등록
4. API 테스트

### Phase 2: 프론트엔드 기반 (1일)  
1. API 클라이언트 설정
2. 공통 훅 구현
3. DTO 구현
4. 상태 관리 스토어 구현

### Phase 3: UI 기반 (1일)
1. shadcn-ui 컴포넌트 설치
2. 공통 컴포넌트 구현
3. 지도 관련 컴포넌트 구현

### Phase 4: 외부 연동 (1일)
1. 지도 SDK 설정
2. 위치 서비스 구현
3. 환경 변수 설정
4. 통합 테스트

---

## 7. 충돌 방지 전략

### 7.1 파일 구조 분리
- **백엔드**: `src/features/[feature]/backend/` 구조로 기능별 분리
- **프론트엔드**: `src/features/[feature]/hooks/`, `src/features/[feature]/lib/` 구조로 분리
- **공통**: `src/lib/`, `src/components/common/` 구조로 분리

### 7.2 네이밍 컨벤션
- **API 엔드포인트**: `/api/places/*`, `/api/reviews/*`로 명확히 분리
- **훅 이름**: `use[Feature][Action]` 패턴 (예: `usePlaceQuery`, `useCreateReviewMutation`)
- **스토어 이름**: `use[Feature]Store` 패턴 (예: `useMapStore`, `useSearchStore`)

### 7.3 의존성 관리
- **백엔드**: 각 기능별로 독립적인 service, schema, error 파일
- **프론트엔드**: 각 기능별로 독립적인 hooks, dto 파일
- **공통**: 최소한의 의존성만 허용

---

## 8. 검증 체크리스트

### 8.1 백엔드 검증
- [ ] 데이터베이스 마이그레이션 정상 실행
- [ ] API 엔드포인트 정상 동작
- [ ] 에러 처리 정상 동작
- [ ] 스키마 검증 정상 동작

### 8.2 프론트엔드 검증
- [ ] API 클라이언트 정상 동작
- [ ] 공통 훅 정상 동작
- [ ] 상태 관리 정상 동작
- [ ] 타입 안정성 확보

### 8.3 UI 검증
- [ ] shadcn-ui 컴포넌트 정상 렌더링
- [ ] 공통 컴포넌트 재사용 가능
- [ ] 지도 컴포넌트 정상 동작
- [ ] 반응형 디자인 적용

### 8.4 통합 검증
- [ ] 전체 플로우 정상 동작
- [ ] 에러 상황 처리 정상
- [ ] 성능 최적화 적용
- [ ] 접근성 기준 충족

---

## 9. 주의사항

### 9.1 오버엔지니어링 금지
- **구현하지 않을 것**: 사용자 인증, 이미지 업로드, 실시간 알림, 관리자 기능
- **구현할 것**: 문서에 명시된 기능만 구현
- **확장성**: 향후 필요 시 추가 가능한 구조만 고려

### 9.2 성능 고려사항
- **지도 렌더링**: 마커 클러스터링 적용
- **API 호출**: React Query 캐싱 활용
- **상태 관리**: 최소한의 상태만 전역 관리

### 9.3 보안 고려사항
- **비밀번호**: bcrypt 해싱 적용
- **입력 검증**: Zod 스키마로 모든 입력 검증
- **SQL 인젝션**: 파라미터화된 쿼리 사용

---

## 10. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2025-10-21 | 1.0.0 | 초안 작성 | AI Agent |

---

**문서 작성 완료**

이 문서는 페이지 단위 개발을 시작하기 전에 구현해야 할 모든 공통 모듈을 정의합니다. 이 모듈들이 완성되면 모든 페이지를 병렬로 개발할 수 있습니다.
