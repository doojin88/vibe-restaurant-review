# Restaurant Review - 제품 요구사항 문서 (PRD)

## 📋 목차

1. [제품 개요](#1-제품-개요)
2. [Stakeholders](#2-stakeholders)
3. [기술 스택](#3-기술-스택)
4. [아키텍처 개요](#4-아키텍처-개요)
5. [포함 페이지](#5-포함-페이지)
6. [사용자 여정](#6-사용자-여정)
7. [정보 구조 (IA)](#7-정보-구조-ia)
8. [핵심 기능 명세](#8-핵심-기능-명세)
9. [데이터베이스 설계](#9-데이터베이스-설계)
10. [API 명세](#10-api-명세)
11. [개발 가이드라인](#11-개발-가이드라인)
12. [빌드 및 배포](#12-빌드-및-배포)
13. [향후 개선 사항](#13-향후-개선-사항)

---

## 1. 제품 개요

### 1.1 제품명
**Restaurant Review** - 위치 기반 간편 맛집 리뷰 서비스

### 1.2 비전 및 목적
- 사용자가 현재 위치를 중심으로 주변 맛집을 쉽게 검색하고 리뷰를 작성/조회할 수 있는 간편한 서비스
- **비로그인 상태**에서도 모든 기능을 이용할 수 있어 접근성이 높음
- 지도 기반 인터랙션을 통해 직관적이고 빠른 맛집 탐색 경험 제공

### 1.3 타겟 유저
- **주요 타겟**: 주변 맛집을 빠르게 찾고 간편하게 리뷰를 남기고 싶은 20-40대 모바일 사용자
- **부타겟**: 특정 지역의 맛집 정보를 미리 찾아보고 싶은 사용자
- **특징**: 회원가입 없이 즉시 사용 가능 (비밀번호 기반 리뷰 관리)

### 1.4 핵심 가치
- **간편성**: 회원가입 없이 즉시 이용 가능
- **직관성**: 지도 중심의 UI로 현재 위치 기반 빠른 탐색
- **신뢰성**: 비밀번호 기반으로 본인이 작성한 리뷰만 수정/삭제 가능

---

## 2. Stakeholders

### 2.1 내부 이해관계자
| 역할 | 책임 |
|------|------|
| **제품 책임자 (PO)** | 제품 로드맵 정의, 우선순위 결정, 비즈니스 요구사항 관리 |
| **개발 리드** | 기술 스택 선정, 아키텍처 설계, 코드 품질 관리 |
| **풀스택 개발자** | 프론트엔드/백엔드 구현, API 개발, 데이터베이스 설계 |
| **UI/UX 디자이너** | 화면 설계, 인터랙션 디자인, 접근성 개선 |

### 2.2 외부 이해관계자
| 역할 | 책임 |
|------|------|
| **최종 사용자** | 서비스 사용, 피드백 제공 |
| **지도 API 제공사** | 지도 데이터 및 POI 정보 제공 (Kakao Map, Naver Map 등) |
| **인프라 제공사** | Supabase (데이터베이스 + 스토리지), Vercel (호스팅) |

---

## 3. 기술 스택

### 3.1 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 15.1.0 | React 프레임워크 (App Router) |
| **React** | 19.0.0 | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안정성 |
| **Tailwind CSS** | 4.1.13 | 유틸리티 기반 스타일링 |
| **shadcn-ui** | - | 재사용 가능한 UI 컴포넌트 |
| **@tanstack/react-query** | 5.x | 서버 상태 관리 |
| **zustand** | 4.x | 경량 전역 상태 관리 |
| **react-hook-form** | 7.x | 폼 상태 관리 및 유효성 검증 |
| **zod** | 3.x | 스키마 기반 데이터 검증 |

### 3.2 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| **Hono** | 4.9.9 | 경량 HTTP 프레임워크 |
| **Supabase** | 2.58.0 | BaaS (Database, Auth, Storage) |
| **Next.js API Routes** | 15.1.0 | Hono 앱 위임 (Runtime: Node.js) |

### 3.3 유틸리티 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| **date-fns** | 날짜/시간 처리 |
| **ts-pattern** | 타입 안전한 패턴 매칭 |
| **es-toolkit** | 유틸리티 함수 |
| **lucide-react** | 아이콘 |
| **react-use** | 범용 React 훅 |
| **axios** | HTTP 클라이언트 |

### 3.4 개발 도구
| 도구 | 용도 |
|------|------|
| **ESLint** | 코드 린팅 |
| **npm** | 패키지 관리 |
| **Turbopack** | 개발 서버 번들러 |

---

## 4. 아키텍처 개요

### 4.1 전체 구조
```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  - React 19 + Next.js 15 (App Router)                   │
│  - All Client Components ("use client")                 │
│  - TanStack Query (Server State)                        │
│  - Zustand (Global State)                               │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP (REST API)
                   ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes Layer                    │
│  - /api/[[...hono]]/route.ts                            │
│  - Runtime: Node.js                                      │
└──────────────────┬──────────────────────────────────────┘
                   │ Delegates to
                   ↓
┌─────────────────────────────────────────────────────────┐
│                  Hono Application                        │
│  - src/backend/hono/app.ts                              │
│  - Middleware Stack:                                     │
│    1. errorBoundary()                                   │
│    2. withAppContext()                                  │
│    3. withSupabase()                                    │
│  - Feature Routes Registration                          │
└──────────────────┬──────────────────────────────────────┘
                   │ Service Layer
                   ↓
┌─────────────────────────────────────────────────────────┐
│              Feature Services                            │
│  - src/features/[feature]/backend/service.ts            │
│  - Supabase Queries                                     │
│  - Business Logic                                        │
└──────────────────┬──────────────────────────────────────┘
                   │ SQL Queries
                   ↓
┌─────────────────────────────────────────────────────────┐
│                    Supabase                              │
│  - PostgreSQL Database                                   │
│  - Storage (Images)                                      │
│  - RLS Disabled (Service Role Key)                      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 디렉토리 구조
```
src/
├── app/                          # Next.js App Router
│   ├── api/[[...hono]]/          # Hono 위임 엔드포인트
│   ├── page.tsx                  # 홈 화면 (지도)
│   ├── search/page.tsx           # 장소 검색 결과
│   ├── place/
│   │   └── [id]/
│   │       ├── page.tsx          # 장소 상세
│   │       └── review/page.tsx   # 리뷰 작성
│   └── layout.tsx                # 루트 레이아웃
│
├── backend/                      # 백엔드 레이어
│   ├── hono/
│   │   ├── app.ts                # Hono 앱 생성 (싱글턴)
│   │   └── context.ts            # AppEnv 타입 정의
│   ├── middleware/
│   │   ├── error.ts              # 에러 바운더리
│   │   ├── context.ts            # 환경 변수 + Logger 주입
│   │   └── supabase.ts           # Supabase 클라이언트 주입
│   ├── http/
│   │   └── response.ts           # 응답 헬퍼 (success/failure)
│   ├── supabase/
│   │   └── client.ts             # Supabase 클라이언트 래퍼
│   └── config/
│       └── index.ts              # 환경 변수 파싱 (Zod)
│
├── features/                     # 기능별 모듈
│   ├── place/
│   │   ├── backend/
│   │   │   ├── route.ts          # Hono 라우터
│   │   │   ├── service.ts        # Supabase 쿼리
│   │   │   ├── schema.ts         # Zod 스키마
│   │   │   └── error.ts          # 에러 코드
│   │   ├── components/
│   │   │   ├── place-card.tsx
│   │   │   └── place-map.tsx
│   │   ├── hooks/
│   │   │   └── usePlaceQuery.ts
│   │   └── lib/
│   │       └── dto.ts            # 스키마 재노출
│   │
│   └── review/
│       ├── backend/
│       │   ├── route.ts
│       │   ├── service.ts
│       │   ├── schema.ts
│       │   └── error.ts
│       ├── components/
│       │   ├── review-form.tsx
│       │   └── review-list.tsx
│       ├── hooks/
│       │   └── useReviewMutation.ts
│       └── lib/
│           └── dto.ts
│
├── components/ui/                # shadcn-ui 컴포넌트
├── lib/
│   ├── utils.ts                  # cn() 등
│   ├── remote/
│   │   └── api-client.ts         # HTTP 클라이언트
│   └── supabase/
│       ├── client.ts             # 브라우저 클라이언트
│       └── server.ts             # 서버 클라이언트
│
├── hooks/                        # 공통 훅
├── constants/                    # 공통 상수
└── types/                        # 공통 타입

supabase/
└── migrations/                   # SQL 마이그레이션 파일
    ├── 0001_create_places_table.sql
    ├── 0002_create_reviews_table.sql
    └── ...
```

### 4.3 백엔드 레이어 상세

#### 4.3.1 Hono 앱 초기화 흐름
```typescript
// src/app/api/[[...hono]]/route.ts
export const runtime = 'nodejs'; // Supabase service-role 사용

const app = createHonoApp();
export const { GET, POST, PUT, DELETE, PATCH } = handle(app);
```

```typescript
// src/backend/hono/app.ts
export function createHonoApp() {
  const app = new Hono<AppEnv>();

  // 1. 에러 바운더리
  app.use('*', errorBoundary());

  // 2. 컨텍스트 주입 (config, logger)
  app.use('*', withAppContext());

  // 3. Supabase 클라이언트 주입 (service-role)
  app.use('*', withSupabase());

  // 4. 기능별 라우터 등록
  registerPlaceRoutes(app);
  registerReviewRoutes(app);

  return app;
}
```

#### 4.3.2 컨텍스트 구조
```typescript
// src/backend/hono/context.ts
export type AppEnv = {
  Variables: {
    supabase: SupabaseClient;
    logger: Logger;
    config: AppConfig;
  };
};

// 사용 예시
app.get('/api/places', async (c) => {
  const supabase = c.get('supabase');
  const logger = c.get('logger');
  // ...
});
```

#### 4.3.3 응답 패턴
```typescript
// src/backend/http/response.ts
export const success = <T>(data: T) => ({ ok: true, data });
export const failure = (code: string, message: string) => ({
  ok: false,
  error: { code, message }
});

// 사용 예시
return c.json(success({ places: [...] }));
return c.json(failure('PLACE_NOT_FOUND', '장소를 찾을 수 없습니다.'), 404);
```

### 4.4 프론트엔드 레이어 상세

#### 4.4.1 클라이언트 컴포넌트 원칙
- **모든 컴포넌트는 Client Component**로 작성 (`"use client"` 필수)
- 서버 상태는 **TanStack Query**로만 관리
- 전역 UI 상태는 **Zustand** 사용

#### 4.4.2 HTTP 클라이언트 패턴
```typescript
// src/lib/remote/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// 사용 예시
// src/features/place/hooks/usePlaceQuery.ts
export function usePlaceQuery(placeId: string) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/places/${placeId}`);
      return PlaceSchema.parse(data);
    },
  });
}
```

---

## 5. 포함 페이지

### 5.1 페이지 목록
| 페이지명 | 경로 | 주요 기능 |
|---------|------|----------|
| **홈 화면** | `/` | 지도 기반 장소 탐색, 검색 |
| **장소 검색 결과** | `/search?q={keyword}` | 키워드 기반 장소 리스트 표시 |
| **장소 상세** | `/place/[id]` | 장소 정보 + 리뷰 목록 |
| **리뷰 작성** | `/place/[id]/review` | 리뷰 작성 폼 |

### 5.2 페이지별 상세 명세
각 페이지의 상세 요구사항은 다음 문서 참조:
- 홈 화면: `/docs/requirement/home_screen_spec.md`
- 장소 검색 결과: `/docs/requirement/place_search_spec.md`
- 리뷰 작성: `/docs/requirement/review_write_spec.md`
- 장소 상세: `/docs/requirement/place_detail_spec.md`

---

## 6. 사용자 여정

### 6.1 타겟 유저 세그먼트

#### 세그먼트 1: 현재 위치 기반 맛집 탐색자
- **특징**: 지금 있는 위치에서 가까운 맛집을 빠르게 찾고 싶음
- **니즈**: 지도 기반 직관적인 탐색, 리뷰 기반 신뢰성

#### 세그먼트 2: 특정 맛집 검색자
- **특징**: 특정 가게명이나 지역명으로 검색
- **니즈**: 빠른 검색, 상세한 리뷰 정보

#### 세그먼트 3: 리뷰 작성자
- **특징**: 방문한 맛집에 대한 경험을 공유하고 싶음
- **니즈**: 간편한 작성 프로세스, 비밀번호 기반 관리

---

### 6.2 주요 사용자 여정

#### 여정 1: 현재 위치 기반 맛집 탐색 및 리뷰 확인
```
[시작] → 홈 화면 → 지도에서 마커 클릭 → 장소 상세 → 리뷰 확인 → [종료]
```

**단계별 상세:**
1. **홈 화면 (`/`)**
   - 사용자 현재 위치 자동 감지
   - 지도 중심을 현재 위치로 설정
   - 리뷰가 있는 장소에 마커 표시

2. **지도 인터랙션**
   - 지도 드래그/줌으로 탐색
   - 마커 클릭 시 간단한 장소 정보 표시

3. **장소 상세 페이지 (`/place/[id]`)**
   - 마커 클릭 후 페이지 이동
   - 장소명, 주소, 카테고리 표시
   - 평균 평점 및 리뷰 개수 표시
   - 리뷰 리스트 (최신순)

---

#### 여정 2: 키워드 검색을 통한 장소 찾기 및 리뷰 작성
```
[시작] → 홈 화면 → 검색 → 검색 결과 → 리뷰 작성 → 완료 메시지 → [종료]
```

**단계별 상세:**
1. **홈 화면 (`/`)**
   - 상단 검색바에 키워드 입력 (예: "이차돌")

2. **장소 검색 결과 (`/search?q={keyword}`)**
   - 검색 모달/페이지 표시
   - 일치하는 장소 리스트 (카드 형태)
   - 각 카드에 "리뷰 작성" 버튼

3. **리뷰 작성 페이지 (`/place/[id]/review`)**
   - "리뷰 작성" 버튼 클릭 시 이동
   - 폼 필드:
     - 작성자명 (이메일 형식, 최대 20자)
     - 평점 (1~5 별점)
     - 리뷰 내용 (10~500자)
     - 비밀번호 (수정/삭제용)
   - "리뷰 작성하기" 버튼 클릭

4. **작성 완료**
   - 성공 메시지 표시
   - 장소 상세 페이지로 자동 이동 (또는 검색 결과로 복귀)

---

#### 여정 3: 장소 상세에서 직접 리뷰 작성
```
[시작] → 장소 상세 → 리뷰 작성 버튼 클릭 → 리뷰 작성 → 장소 상세로 복귀 → [종료]
```

**단계별 상세:**
1. **장소 상세 페이지 (`/place/[id]`)**
   - 지도 마커 또는 검색 결과에서 진입
   - "리뷰 작성 버튼" 클릭

2. **리뷰 작성 페이지 (`/place/[id]/review`)**
   - 동일한 작성 폼

3. **작성 완료 후**
   - 장소 상세 페이지로 복귀
   - 방금 작성한 리뷰가 리스트 최상단에 표시

---

### 6.3 사용자 흐름도

```
                        [사용자 진입]
                              |
                    ┌─────────▼─────────┐
                    │   홈 화면 (/)      │
                    │  - 지도 + 검색바   │
                    └─────┬───────┬──────┘
                          │       │
              ┌───────────┘       └───────────┐
              │                                │
              ▼                                ▼
    ┌─────────────────┐              ┌─────────────────┐
    │  지도 마커 클릭   │              │   검색바 입력    │
    └─────────┬────────┘              └────────┬────────┘
              │                                │
              │                                ▼
              │                      ┌──────────────────────┐
              │                      │ 장소 검색 결과 모달   │
              │                      │ (/search?q=...)      │
              │                      └──────────┬───────────┘
              │                                │
              │                    ┌───────────┴─────────────┐
              │                    │                         │
              │                    ▼                         ▼
              │          ┌──────────────────┐    ┌─────────────────────┐
              │          │ 장소 카드 클릭    │    │ 리뷰 작성 버튼 클릭 │
              │          └────────┬─────────┘    └─────────┬───────────┘
              │                   │                        │
              └───────────────────┴────────────────────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │  장소 상세 페이지   │
                        │  (/place/[id])     │
                        │  - 장소 정보        │
                        │  - 평점 요약        │
                        │  - 리뷰 리스트      │
                        └─────────┬──────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
         ┌──────────────────┐        ┌─────────────────────┐
         │  리뷰 읽기        │        │ 리뷰 작성 버튼 클릭 │
         └──────────────────┘        └─────────┬───────────┘
                                               │
                                               ▼
                                    ┌──────────────────────┐
                                    │   리뷰 작성 페이지    │
                                    │ (/place/[id]/review) │
                                    │  - 작성자명          │
                                    │  - 평점              │
                                    │  - 내용              │
                                    │  - 비밀번호          │
                                    └─────────┬────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  작성 완료 및     │
                                    │  장소 상세로 복귀 │
                                    └──────────────────┘
```

---

## 7. 정보 구조 (IA)

### 7.1 사이트맵 (Tree 구조)

```
Vibe Restaurant Review
│
├── / (홈)
│   ├── 지도 뷰
│   │   ├── 현재 위치 마커
│   │   ├── 장소 마커 (리뷰 있는 곳)
│   │   └── 지도 컨트롤 (줌, 스케일)
│   │
│   └── 검색 바
│       └── /search?q={keyword} (검색 결과 모달/페이지)
│           └── 장소 카드 리스트
│               ├── 장소 카드 1
│               │   ├── 가게명
│               │   ├── 주소
│               │   ├── 카테고리
│               │   └── [리뷰 작성 버튼] → /place/[id]/review
│               │
│               └── 장소 카드 2 (반복)
│
├── /place/[id] (장소 상세)
│   ├── 장소 정보 카드
│   │   ├── 가게명
│   │   ├── 주소
│   │   └── 카테고리
│   │
│   ├── 평점 요약
│   │   ├── 평균 별점
│   │   └── 리뷰 개수
│   │
│   ├── [리뷰 작성 버튼] → /place/[id]/review
│   │
│   └── 리뷰 리스트
│       ├── 리뷰 아이템 1
│       │   ├── 작성자명
│       │   ├── 평점 (별)
│       │   ├── 작성일
│       │   └── 리뷰 내용
│       │
│       └── 리뷰 아이템 2 (반복)
│
└── /place/[id]/review (리뷰 작성)
    ├── [뒤로가기 버튼]
    ├── 장소 정보 (가게명, 주소, 업종)
    └── 리뷰 작성 폼
        ├── 작성자명 입력 (이메일 형식, 최대 20자)
        ├── 평점 선택 (별 1~5)
        ├── 리뷰 내용 입력 (10~500자)
        ├── 비밀번호 입력 (수정/삭제용)
        └── [리뷰 작성하기 버튼]
```

### 7.2 내비게이션 구조

#### 7.2.1 주요 진입점
1. **홈 (`/`)**
   - 모든 사용자의 첫 진입점
   - 지도 + 검색 기능 제공

2. **검색 결과 (`/search`)**
   - 홈 화면 검색바에서 진입
   - 모달 또는 전체 페이지 형태

3. **장소 상세 (`/place/[id]`)**
   - 지도 마커 클릭 또는 검색 결과에서 진입

4. **리뷰 작성 (`/place/[id]/review`)**
   - 검색 결과 또는 장소 상세에서 진입

#### 7.2.2 이동 경로
```
홈 → 검색 결과 → 리뷰 작성
  ↓              ↓
장소 상세 ← ← ← ← ┘
  ↓
리뷰 작성
```

---

## 8. 주요 기능 명세

### 8.1 홈 화면 (지도 뷰)

#### 8.1.1 기능 요구사항
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| **지도 표시** | 사용자 현재 위치 중심으로 지도 로딩 | P0 |
| **현재 위치 마커** | 사용자 위치에 고유 마커 표시 | P0 |
| **장소 마커** | 리뷰가 있는 장소에 마커 표시 | P0 |
| **마커 클릭** | 마커 클릭 시 장소 상세 페이지로 이동 | P0 |
| **지도 드래그/줌** | 터치/마우스 제스처 지원 | P0 |
| **검색 바** | 상단 고정, 플레이스홀더 표시 | P0 |
| **검색 실행** | 입력 후 검색 결과 모달 표시 | P0 |

#### 8.1.2 기술 명세
- **지도 SDK**: Kakao Map API 또는 Naver Map API
- **위치 정보**: Geolocation API
- **상태 관리**: Zustand (지도 중심 좌표, 줌 레벨)
- **데이터 페칭**: React Query (장소 마커 데이터)

#### 8.1.3 UI 컴포넌트
```typescript
// src/features/place/components/place-map.tsx
'use client';

export function PlaceMap() {
  const { latitude, longitude } = useCurrentLocation();
  const { data: places } = usePlacesWithReviews({ lat, lng, radius: 1000 });

  return (
    <div className="relative h-screen">
      <SearchBar onSearch={handleSearch} />
      <Map center={{ lat: latitude, lng: longitude }}>
        <CurrentLocationMarker />
        {places?.map(place => (
          <PlaceMarker key={place.id} place={place} />
        ))}
      </Map>
      <MapControls />
    </div>
  );
}
```

---

### 8.2 장소 검색 결과

#### 8.2.1 기능 요구사항
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| **키워드 검색** | 장소명 기반 검색 | P0 |
| **결과 리스트** | 일치하는 장소 카드 형태로 표시 | P0 |
| **리뷰 작성 버튼** | 각 장소 카드에 버튼 표시 | P0 |
| **닫기 버튼** | 모달 닫기 (홈으로 복귀) | P0 |
| **무한 스크롤** | 결과가 많을 경우 페이지네이션 | P1 |

#### 8.2.2 API 엔드포인트
```
GET /api/places/search?q={keyword}&page={page}&limit={limit}
```

**응답 예시:**
```json
{
  "ok": true,
  "data": {
    "places": [
      {
        "id": "place_123",
        "name": "이차돌 신설동점",
        "address": "서울특별시 종로구 종로 405 1층",
        "category": "한식 > 소고기구이",
        "latitude": 37.5741,
        "longitude": 127.0167
      }
    ],
    "total": 15,
    "hasMore": true
  }
}
```

#### 8.2.3 UI 컴포넌트
```typescript
// src/features/place/components/place-search-modal.tsx
'use client';

export function PlaceSearchModal({ keyword }: { keyword: string }) {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['places', 'search', keyword],
    queryFn: ({ pageParam = 1 }) => searchPlaces(keyword, pageParam),
  });

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetHeader>
        <SheetTitle>검색 결과</SheetTitle>
        <SheetClose />
      </SheetHeader>
      <SheetContent>
        {data?.pages.map(page => (
          page.places.map(place => (
            <PlaceCard key={place.id} place={place} />
          ))
        ))}
        {hasNextPage && <LoadMoreButton onClick={fetchNextPage} />}
      </SheetContent>
    </Sheet>
  );
}
```

---

### 8.3 장소 상세 페이지

#### 8.3.1 기능 요구사항
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| **장소 정보 표시** | 가게명, 주소, 카테고리 | P0 |
| **평점 요약** | 평균 별점, 리뷰 개수 | P0 |
| **리뷰 리스트** | 최신순 정렬, 페이지네이션 | P0 |
| **리뷰 작성 버튼** | 리뷰 작성 페이지로 이동 | P0 |
| **빈 상태 처리** | 리뷰 없을 경우 안내 메시지 | P0 |

#### 8.3.2 API 엔드포인트
```
GET /api/places/{placeId}
GET /api/places/{placeId}/reviews?page={page}&limit={limit}
```

**응답 예시:**
```json
// GET /api/places/{placeId}
{
  "ok": true,
  "data": {
    "place": {
      "id": "place_123",
      "name": "이차돌 신설동점",
      "address": "서울특별시 종로구 종로 405 1층",
      "category": "한식 > 소고기구이",
      "averageRating": 4.5,
      "reviewCount": 12
    }
  }
}

// GET /api/places/{placeId}/reviews
{
  "ok": true,
  "data": {
    "reviews": [
      {
        "id": "review_456",
        "authorName": "user@example.com",
        "rating": 5,
        "content": "맛있어요!",
        "createdAt": "2025-10-20T12:34:56Z"
      }
    ],
    "total": 12,
    "hasMore": false
  }
}
```

#### 8.3.3 UI 컴포넌트
```typescript
// src/app/place/[id]/page.tsx
'use client';

export default async function PlaceDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const { data: place } = usePlaceQuery(id);
  const { data: reviews } = useReviewsQuery(id);

  return (
    <div className="container mx-auto p-4">
      <PlaceInfoCard place={place} />
      <RatingSummary
        averageRating={place.averageRating}
        reviewCount={place.reviewCount}
      />
      <Button asChild>
        <Link href={`/place/${id}/review`}>리뷰 작성</Link>
      </Button>
      <ReviewList reviews={reviews} />
    </div>
  );
}
```

---

### 8.4 리뷰 작성 페이지

#### 8.4.1 기능 요구사항
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| **작성자명 입력** | 이메일 형식, 최대 20자 | P0 |
| **평점 선택** | 별 1~5개 | P0 |
| **리뷰 내용 입력** | 최소 10자, 최대 500자 | P0 |
| **비밀번호 입력** | 수정/삭제용 (마스킹 처리) | P0 |
| **유효성 검증** | 실시간 폼 검증 | P0 |
| **글자 수 표시** | 현재/최대 글자 수 (예: 125/500) | P0 |
| **제출 버튼 활성화** | 모든 필수 항목 입력 시 활성화 | P0 |

#### 8.4.2 API 엔드포인트
```
POST /api/places/{placeId}/reviews
```

**요청 바디:**
```json
{
  "authorName": "user@example.com",
  "rating": 5,
  "content": "정말 맛있었습니다. 다음에 또 올게요!",
  "password": "hashed_password_123"
}
```

**응답 예시:**
```json
{
  "ok": true,
  "data": {
    "review": {
      "id": "review_789",
      "authorName": "user@example.com",
      "rating": 5,
      "content": "정말 맛있었습니다. 다음에 또 올게요!",
      "createdAt": "2025-10-21T10:00:00Z"
    }
  }
}
```

#### 8.4.3 Zod 스키마
```typescript
// src/features/review/backend/schema.ts
import { z } from 'zod';

export const CreateReviewSchema = z.object({
  authorName: z.string()
    .email('이메일 형식이 아닙니다.')
    .max(20, '작성자명은 최대 20자입니다.'),
  rating: z.number()
    .int()
    .min(1, '평점은 최소 1점입니다.')
    .max(5, '평점은 최대 5점입니다.'),
  content: z.string()
    .min(10, '리뷰 내용은 최소 10자입니다.')
    .max(500, '리뷰 내용은 최대 500자입니다.'),
  password: z.string()
    .min(4, '비밀번호는 최소 4자입니다.'),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
```

#### 8.4.4 UI 컴포넌트
```typescript
// src/features/review/components/review-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReviewSchema } from '../lib/dto';

export function ReviewForm({ placeId }: { placeId: string }) {
  const form = useForm({
    resolver: zodResolver(CreateReviewSchema),
  });

  const mutation = useCreateReviewMutation(placeId);

  const onSubmit = (data: CreateReviewInput) => {
    mutation.mutate(data, {
      onSuccess: () => {
        toast({ title: '리뷰가 등록되었습니다.' });
        router.push(`/place/${placeId}`);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="authorName" label="작성자명" />
        <FormField name="rating" label="평점" type="rating" />
        <FormField
          name="content"
          label="리뷰 내용"
          type="textarea"
          maxLength={500}
        />
        <FormField name="password" label="비밀번호" type="password" />
        <Button type="submit" disabled={!form.formState.isValid}>
          리뷰 작성하기
        </Button>
      </form>
    </Form>
  );
}
```

---

## 9. 데이터베이스 설계

### 9.1 ERD

```
┌─────────────────────────────────────────────────────────┐
│                        places                            │
├─────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                           │
│ name (text, NOT NULL)                                   │
│ address (text, NOT NULL)                                │
│ category (text, NOT NULL)                               │
│ latitude (numeric(10,8), NOT NULL)                      │
│ longitude (numeric(11,8), NOT NULL)                     │
│ created_at (timestamptz, DEFAULT now())                 │
│ updated_at (timestamptz, DEFAULT now())                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 1:N
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                       reviews                            │
├─────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                           │
│ place_id (uuid, FK → places.id, NOT NULL)              │
│ author_name (text, NOT NULL)                            │
│ rating (integer, NOT NULL, CHECK 1-5)                   │
│ content (text, NOT NULL)                                │
│ password_hash (text, NOT NULL)                          │
│ created_at (timestamptz, DEFAULT now())                 │
│ updated_at (timestamptz, DEFAULT now())                 │
└─────────────────────────────────────────────────────────┘
```

### 9.2 테이블 상세

#### 9.2.1 places 테이블
```sql
-- supabase/migrations/0001_create_places_table.sql
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 위치 기반 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_places_location ON places (latitude, longitude);

-- 이름 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_places_name ON places USING gin(name gin_trgm_ops);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_places_updated_at
BEFORE UPDATE ON places
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (service-role 키 사용)
ALTER TABLE places DISABLE ROW LEVEL SECURITY;
```

#### 9.2.2 reviews 테이블
```sql
-- supabase/migrations/0002_create_reviews_table.sql
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 500),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- place_id 기반 조회 최적화
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews (place_id);

-- 최신순 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
```

### 9.3 시드 데이터 (예시)
```sql
-- supabase/migrations/0003_seed_places.sql
INSERT INTO places (id, name, address, category, latitude, longitude)
VALUES
  (
    'place_001',
    '이차돌 신설동점',
    '서울특별시 종로구 종로 405 1층',
    '한식 > 소고기구이',
    37.5741000,
    127.0167000
  ),
  (
    'place_002',
    '이차돌 플러스 돌곶이역점',
    '서울특별시 성북구 돌곶이로 62 1층',
    '한식 > 소고기구이',
    37.5920000,
    127.0520000
  )
ON CONFLICT (id) DO NOTHING;
```

---

## 10. API 명세

### 10.1 API 설계 원칙
- **RESTful 설계**: 리소스 기반 URL, HTTP 메서드 활용
- **일관된 응답 형식**: `{ ok: boolean, data?: T, error?: { code, message } }`
- **Zod 스키마 검증**: 모든 요청/응답은 Zod로 검증
- **에러 코드 체계**: 기능별 에러 코드 정의 (`PLACE_NOT_FOUND`, `REVIEW_VALIDATION_FAILED` 등)

### 10.2 엔드포인트 목록

#### 10.2.1 장소 (Places)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/places/search` | 키워드로 장소 검색 |
| GET | `/api/places/:id` | 장소 상세 조회 |
| GET | `/api/places/nearby` | 현재 위치 기반 주변 장소 조회 |

#### 10.2.2 리뷰 (Reviews)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/places/:placeId/reviews` | 특정 장소의 리뷰 목록 조회 |
| POST | `/api/places/:placeId/reviews` | 리뷰 작성 |
| PUT | `/api/reviews/:id` | 리뷰 수정 (비밀번호 필요) |
| DELETE | `/api/reviews/:id` | 리뷰 삭제 (비밀번호 필요) |

---

### 10.3 API 상세 명세

#### 10.3.1 GET /api/places/search
**설명**: 키워드로 장소 검색

**쿼리 파라미터:**
```typescript
{
  q: string;         // 검색 키워드 (필수)
  page?: number;     // 페이지 번호 (기본값: 1)
  limit?: number;    // 페이지당 개수 (기본값: 10)
}
```

**응답:**
```typescript
{
  ok: true,
  data: {
    places: Array<{
      id: string;
      name: string;
      address: string;
      category: string;
      latitude: number;
      longitude: number;
    }>;
    total: number;
    hasMore: boolean;
  }
}
```

**에러 응답:**
```typescript
{
  ok: false,
  error: {
    code: 'INVALID_QUERY' | 'SEARCH_FAILED',
    message: string;
  }
}
```

---

#### 10.3.2 GET /api/places/:id
**설명**: 장소 상세 정보 조회 (평균 평점 포함)

**응답:**
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
      averageRating: number;  // 평균 평점 (소수점 1자리)
      reviewCount: number;    // 리뷰 개수
    }
  }
}
```

**에러 응답:**
```typescript
{
  ok: false,
  error: {
    code: 'PLACE_NOT_FOUND',
    message: '장소를 찾을 수 없습니다.',
  }
}
```

---

#### 10.3.3 GET /api/places/:placeId/reviews
**설명**: 특정 장소의 리뷰 목록 조회 (최신순)

**쿼리 파라미터:**
```typescript
{
  page?: number;   // 페이지 번호 (기본값: 1)
  limit?: number;  // 페이지당 개수 (기본값: 10)
}
```

**응답:**
```typescript
{
  ok: true,
  data: {
    reviews: Array<{
      id: string;
      authorName: string;
      rating: number;
      content: string;
      createdAt: string;  // ISO 8601 형식
    }>;
    total: number;
    hasMore: boolean;
  }
}
```

---

#### 10.3.4 POST /api/places/:placeId/reviews
**설명**: 리뷰 작성

**요청 바디:**
```typescript
{
  authorName: string;  // 이메일 형식, 최대 20자
  rating: number;      // 1~5
  content: string;     // 10~500자
  password: string;    // 최소 4자
}
```

**응답:**
```typescript
{
  ok: true,
  data: {
    review: {
      id: string;
      authorName: string;
      rating: number;
      content: string;
      createdAt: string;
    }
  }
}
```

**에러 응답:**
```typescript
{
  ok: false,
  error: {
    code: 'VALIDATION_FAILED' | 'PLACE_NOT_FOUND' | 'REVIEW_CREATE_FAILED',
    message: string;
  }
}
```

---

#### 10.3.5 DELETE /api/reviews/:id
**설명**: 리뷰 삭제 (비밀번호 확인 필요)

**요청 바디:**
```typescript
{
  password: string;
}
```

**응답:**
```typescript
{
  ok: true,
  data: {
    deleted: true
  }
}
```

**에러 응답:**
```typescript
{
  ok: false,
  error: {
    code: 'REVIEW_NOT_FOUND' | 'INVALID_PASSWORD' | 'DELETE_FAILED',
    message: string;
  }
}
```

---

### 10.4 Backend 구현 예시

#### 10.4.1 Hono 라우터
```typescript
// src/features/place/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { PlaceService } from './service';
import { SearchPlacesSchema } from './schema';
import { success, failure } from '@/backend/http/response';

export function registerPlaceRoutes(app: Hono) {
  const router = new Hono();

  router.get(
    '/search',
    zValidator('query', SearchPlacesSchema),
    async (c) => {
      const { q, page, limit } = c.req.valid('query');
      const supabase = c.get('supabase');

      const result = await PlaceService.search(supabase, { q, page, limit });

      if (!result.ok) {
        return c.json(failure(result.error.code, result.error.message), 500);
      }

      return c.json(success(result.data));
    }
  );

  app.route('/api/places', router);
}
```

#### 10.4.2 Service Layer
```typescript
// src/features/place/backend/service.ts
import { SupabaseClient } from '@supabase/supabase-js';

export const PlaceService = {
  async search(
    supabase: SupabaseClient,
    params: { q: string; page: number; limit: number }
  ) {
    const { q, page, limit } = params;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('places')
      .select('*', { count: 'exact' })
      .ilike('name', `%${q}%`)
      .range(offset, offset + limit - 1);

    if (error || !data) {
      return failure('SEARCH_FAILED', error?.message ?? '검색 실패');
    }

    return success({
      places: data,
      total: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    });
  },
};
```

---

## 11. 개발 가이드라인

### 11.1 TypeScript 타입 안정성

#### 11.1.1 Supabase 쿼리 타입 처리
```typescript
// ❌ 잘못된 예
const { data } = await supabase.from('places').select('*');
const places: Place[] = data; // 타입 에러 발생 가능

// ✅ 올바른 예
const { data, error } = await supabase.from('places').select('*');
if (error || !data) {
  return failure('FETCH_FAILED', error?.message ?? '조회 실패');
}
const places = data as unknown as Place[];
```

#### 11.1.2 Zod 스키마 기반 타입 추론
```typescript
// backend/schema.ts
export const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  category: z.string(),
});

export type Place = z.infer<typeof PlaceSchema>;

// lib/dto.ts (frontend re-export)
export { PlaceSchema, type Place } from '../backend/schema';

// components에서 사용
import { Place } from '../lib/dto';

function PlaceCard({ place }: { place: Place }) {
  // ...
}
```

---

### 11.2 컴포넌트 아키텍처

#### 11.2.1 Client Component 원칙
```typescript
// ✅ 모든 컴포넌트는 Client Component
'use client';

import { useState } from 'react';

export function ReviewForm() {
  const [rating, setRating] = useState(0);
  // ...
}
```

#### 11.2.2 Page 컴포넌트 Params 처리
```typescript
// ✅ Next.js 15+ params는 Promise 타입
export default async function PlaceDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  // ...
}
```

---

### 11.3 상태 관리 패턴

#### 11.3.1 서버 상태: TanStack Query
```typescript
// src/features/place/hooks/usePlaceQuery.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { PlaceSchema } from '../lib/dto';

export function usePlaceQuery(placeId: string) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/places/${placeId}`);
      return PlaceSchema.parse(data.place);
    },
  });
}
```

#### 11.3.2 전역 UI 상태: Zustand
```typescript
// src/stores/map-store.ts
import { create } from 'zustand';

interface MapState {
  center: { lat: number; lng: number };
  zoomLevel: number;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoomLevel: (level: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: { lat: 37.5665, lng: 126.9780 }, // 서울시청
  zoomLevel: 13,
  setCenter: (center) => set({ center }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
}));
```

---

### 11.4 에러 처리

#### 11.4.1 Backend 에러 정의
```typescript
// src/features/place/backend/error.ts
export const PlaceErrorCode = {
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
  SEARCH_FAILED: 'SEARCH_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const;

export type PlaceErrorCode = typeof PlaceErrorCode[keyof typeof PlaceErrorCode];
```

#### 11.4.2 Frontend 에러 처리
```typescript
// src/features/place/hooks/usePlaceQuery.ts
export function usePlaceQuery(placeId: string) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/places/${placeId}`);
      if (!data.ok) {
        throw new Error(data.error.message);
      }
      return PlaceSchema.parse(data.data.place);
    },
    retry: (failureCount, error) => {
      // 404는 재시도 안 함
      if (error.message.includes('NOT_FOUND')) return false;
      return failureCount < 3;
    },
  });
}
```

---

### 11.5 폼 검증

#### 11.5.1 react-hook-form + Zod
```typescript
// src/features/review/components/review-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReviewSchema, type CreateReviewInput } from '../lib/dto';

export function ReviewForm({ placeId }: { placeId: string }) {
  const form = useForm<CreateReviewInput>({
    resolver: zodResolver(CreateReviewSchema),
    defaultValues: {
      authorName: '',
      rating: 0,
      content: '',
      password: '',
    },
  });

  // ...
}
```

---

### 11.6 코드 스타일

#### 11.6.1 ESLint 규칙 준수
- `const` 사용 (재할당 없는 변수)
- Early Return 패턴
- 명확한 함수/변수명

#### 11.6.2 Tailwind CSS 사용
```typescript
import { cn } from '@/lib/utils';

function PlaceCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      {/* ... */}
    </div>
  );
}
```

---

## 12. 빌드 및 배포

### 12.1 빌드 프로세스

#### 12.1.1 개발 서버 실행
```bash
npm run dev
```
- Turbopack 사용 (고속 번들링)
- 기본 포트: `http://localhost:3000`

#### 12.1.2 프로덕션 빌드
```bash
npm run lint        # ESLint 검사
npm run build       # Next.js 빌드
npm run start       # 프로덕션 서버 실행
```

---

### 12.2 환경 변수 설정

#### 12.2.1 필수 환경 변수
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 지도 API (Kakao or Naver)
NEXT_PUBLIC_MAP_API_KEY=your-map-api-key
```

#### 12.2.2 환경 변수 검증
```typescript
// src/backend/config/index.ts
import { z } from 'zod';

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // ...
});

export const config = EnvSchema.parse(process.env);
```

---

### 12.3 Supabase 마이그레이션

#### 12.3.1 마이그레이션 파일 작성
```bash
# 새 마이그레이션 파일 생성
touch supabase/migrations/0004_add_place_images.sql
```

#### 12.3.2 Supabase Dashboard에서 실행
1. Supabase Dashboard → SQL Editor 접속
2. 마이그레이션 SQL 파일 내용 복사/붙여넣기
3. Run 버튼 클릭
4. 결과 확인

---

### 12.4 배포 (Vercel)

#### 12.4.1 Vercel 설정
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["icn1"]
}
```

#### 12.4.2 환경 변수 설정
- Vercel Dashboard → Settings → Environment Variables
- Production/Preview/Development 환경별 설정

---

## 부록

### A. 용어 정의
| 용어 | 설명 |
|------|------|
| **POI** | Point of Interest, 지도상 주요 지점 |
| **BaaS** | Backend as a Service, 서버리스 백엔드 서비스 |
| **RLS** | Row Level Security, Supabase의 행 단위 보안 정책 |
| **Service Role Key** | Supabase의 관리자 권한 API 키 (RLS 우회) |

---

### B. 참고 문서
- Next.js 공식 문서: https://nextjs.org/docs
- Supabase 공식 문서: https://supabase.com/docs
- Hono 공식 문서: https://hono.dev
- TanStack Query: https://tanstack.com/query/latest
- shadcn-ui: https://ui.shadcn.com

---

### C. 변경 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-10-21 | 1.0.0 | 초안 작성 | AI Agent |

---

**문서 작성 완료**
이 PRD는 Vibe Restaurant Review 프로젝트의 전체 요구사항, 아키텍처, 개발 가이드라인을 포괄합니다.
