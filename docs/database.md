# Database Architecture Document

## 문서 개요
본 문서는 Restaurant Review 서비스의 데이터베이스 스키마와 데이터플로우를 정의합니다.
유저플로우에 명시된 데이터만을 포함하며, PostgreSQL을 기반으로 설계되었습니다.

---

## 1. 데이터플로우 (간략)

### 1.1 홈 화면 - 지도 기반 장소 탐색
```
사용자 진입
  → 위치 정보 조회 (Geolocation API)
  → DB: places 테이블에서 주변 리뷰 존재 장소 조회
     (위도/경도 범위 기반, reviews 카운트 > 0)
  → 지도에 마커 표시
```

### 1.2 장소 검색
```
검색 키워드 입력
  → DB: places 테이블에서 name ILIKE 검색
  → 검색 결과 리스트 반환 (페이지네이션)
  → 장소 카드 표시
```

### 1.3 장소 상세 조회
```
장소 마커/카드 클릭
  → DB: places 테이블에서 장소 정보 조회 (id 기반)
  → DB: reviews 테이블에서 해당 장소 리뷰 집계
     - AVG(rating) → averageRating
     - COUNT(*) → reviewCount
  → DB: reviews 테이블에서 리뷰 목록 조회
     (place_id 기반, created_at DESC, 페이지네이션)
  → 장소 정보 + 평점 요약 + 리뷰 리스트 표시
```

### 1.4 리뷰 작성
```
리뷰 작성 버튼 클릭
  → 리뷰 작성 폼 표시
  → 사용자 입력: authorName, rating, content, password
  → 비밀번호 해싱 (bcrypt)
  → DB: reviews 테이블에 INSERT
     - place_id (FK)
     - author_name
     - rating (1~5)
     - content (10~500자)
     - password_hash
     - created_at (자동)
  → 장소 상세 페이지로 리다이렉트
  → 평균 평점 재계산 (집계 쿼리)
```

### 1.5 리뷰 수정/삭제
```
본인 리뷰 수정/삭제 버튼 클릭
  → 비밀번호 입력 모달 표시
  → DB: reviews 테이블에서 해당 리뷰 조회 (id 기반)
  → 입력 비밀번호와 password_hash 비교 (bcrypt)
  → 일치 시:
     [수정] DB: reviews 테이블 UPDATE (content, rating)
            updated_at 자동 갱신 (트리거)
     [삭제] DB: reviews 테이블 DELETE
  → 평균 평점 재계산
  → 리뷰 리스트 재조회
```

---

## 2. 데이터베이스 스키마

### 2.1 ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────┐
│                        places                            │
├─────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                           │
│ name (TEXT, NOT NULL)                                   │
│ address (TEXT, NOT NULL)                                │
│ category (TEXT, NOT NULL)                               │
│ latitude (NUMERIC(10,8), NOT NULL)                      │
│ longitude (NUMERIC(11,8), NOT NULL)                     │
│ created_at (TIMESTAMPTZ, DEFAULT now())                 │
│ updated_at (TIMESTAMPTZ, DEFAULT now())                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 1 : N
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                       reviews                            │
├─────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                           │
│ place_id (UUID, FK → places.id, NOT NULL)              │
│ author_name (TEXT, NOT NULL)                            │
│ rating (INTEGER, NOT NULL, CHECK 1-5)                   │
│ content (TEXT, NOT NULL, CHECK 10-500자)                │
│ password_hash (TEXT, NOT NULL)                          │
│ created_at (TIMESTAMPTZ, DEFAULT now())                 │
│ updated_at (TIMESTAMPTZ, DEFAULT now())                 │
└─────────────────────────────────────────────────────────┘

관계:
- places : reviews = 1 : N (한 장소는 여러 리뷰를 가질 수 있음)
- reviews.place_id는 places.id를 참조 (ON DELETE CASCADE)
```

---

### 2.2 테이블 상세 명세

#### 2.2.1 places (장소)

**목적**: 리뷰 작성 대상 장소의 기본 정보 저장

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 장소 고유 식별자 |
| name | TEXT | NOT NULL | 장소명 (예: 이차돌 신설동점) |
| address | TEXT | NOT NULL | 주소 (예: 서울특별시 종로구 종로 405 1층) |
| category | TEXT | NOT NULL | 카테고리 (예: 한식 > 소고기구이) |
| latitude | NUMERIC(10, 8) | NOT NULL | 위도 (소수점 8자리) |
| longitude | NUMERIC(11, 8) | NOT NULL | 경도 (소수점 8자리) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성 일시 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정 일시 (트리거로 자동 갱신) |

**인덱스**:
- `idx_places_location`: (latitude, longitude) - 위치 기반 검색 최적화
- `idx_places_name`: name USING gin(name gin_trgm_ops) - 텍스트 검색 최적화 (trigram)

**트리거**:
- `update_places_updated_at`: UPDATE 시 updated_at 자동 갱신

**RLS**: DISABLED (service-role 키 사용)

**유저플로우 연관**:
- 1.1: 주변 장소 조회 (latitude, longitude 범위 검색)
- 1.2: 검색 (name ILIKE 검색)
- 1.3: 장소 상세 조회 (id 기반)
- 4.1: 리뷰 작성 시 장소 정보 표시

---

#### 2.2.2 reviews (리뷰)

**목적**: 사용자가 작성한 장소 리뷰 저장

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 리뷰 고유 식별자 |
| place_id | UUID | NOT NULL, FK → places(id) ON DELETE CASCADE | 리뷰 대상 장소 ID |
| author_name | TEXT | NOT NULL | 작성자명 (이메일 형식, 최대 20자) |
| rating | INTEGER | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | 평점 (1~5) |
| content | TEXT | NOT NULL, CHECK (char_length(content) >= 10 AND char_length(content) <= 500) | 리뷰 내용 (10~500자) |
| password_hash | TEXT | NOT NULL | 비밀번호 해시 (bcrypt, 수정/삭제용) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 작성 일시 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정 일시 (트리거로 자동 갱신) |

**인덱스**:
- `idx_reviews_place_id`: (place_id) - 장소별 리뷰 조회 최적화
- `idx_reviews_created_at`: (created_at DESC) - 최신순 정렬 최적화

**트리거**:
- `update_reviews_updated_at`: UPDATE 시 updated_at 자동 갱신

**RLS**: DISABLED (service-role 키 사용)

**유저플로우 연관**:
- 1.1: 주변 리뷰 존재 장소 조회 (place_id 그룹핑, 카운트)
- 1.3: 장소별 리뷰 목록 조회 (place_id 필터, created_at DESC)
- 1.3: 평균 평점 계산 (AVG(rating) GROUP BY place_id)
- 1.4: 리뷰 작성 (INSERT)
- 3.4: 리뷰 수정 (UPDATE, password_hash 검증)
- 3.4: 리뷰 삭제 (DELETE, password_hash 검증)

---

## 3. 상세 데이터플로우 (쿼리 레벨)

### 3.1 홈 화면 - 주변 리뷰 존재 장소 조���

**입력**: 사용자 현재 위치 (latitude, longitude), 반경 (radius, 기본 1000m)

**SQL 쿼리**:
```sql
-- 1. 위도/경도 범위 계산 (대략적, 실제는 지구 곡률 고려)
-- 위도 1도 ≈ 111km, 경도 1도 ≈ 88km (서울 기준)
-- radius = 1000m = 1km

WITH nearby_places AS (
  SELECT p.*
  FROM places p
  WHERE p.latitude BETWEEN :user_lat - 0.009 AND :user_lat + 0.009
    AND p.longitude BETWEEN :user_lng - 0.0114 AND :user_lng + 0.0114
)
SELECT np.*
FROM nearby_places np
WHERE EXISTS (
  SELECT 1 FROM reviews r WHERE r.place_id = np.id
)
ORDER BY np.name;
```

**Supabase 클라이언트 코드**:
```typescript
const { data, error } = await supabase
  .from('places')
  .select('*')
  .gte('latitude', userLat - 0.009)
  .lte('latitude', userLat + 0.009)
  .gte('longitude', userLng - 0.0114)
  .lte('longitude', userLng + 0.0114);

// 리뷰 존재 여부 필터링은 서비스 레이어에서 처리
// 또는 JOIN으로 최적화:
const { data } = await supabase
  .from('places')
  .select(`
    *,
    reviews!inner(id)
  `)
  .gte('latitude', userLat - 0.009)
  .lte('latitude', userLat + 0.009)
  .gte('longitude', userLng - 0.0114)
  .lte('longitude', userLng + 0.0114);
```

**출력**: 리뷰가 존재하는 장소 배열
```typescript
{
  id: string;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
}[]
```

---

### 3.2 장소 검색

**입력**: 검색 키워드 (q), 페이지 번호 (page), 페이지 크기 (limit)

**SQL 쿼리**:
```sql
-- 기본 ILIKE 검색
SELECT *
FROM places
WHERE name ILIKE :keyword
ORDER BY name
LIMIT :limit OFFSET :offset;

-- 전체 카운트 (페이지네이션용)
SELECT COUNT(*) FROM places WHERE name ILIKE :keyword;
```

**Supabase 클라이언트 코드**:
```typescript
const offset = (page - 1) * limit;

const { data, error, count } = await supabase
  .from('places')
  .select('*', { count: 'exact' })
  .ilike('name', `%${keyword}%`)
  .range(offset, offset + limit - 1);

const hasMore = (count ?? 0) > offset + limit;
```

**출력**:
```typescript
{
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
```

---

### 3.3 장소 상세 조회 (장소 정보 + 평점 요약)

**입력**: 장소 ID (placeId)

**SQL 쿼리**:
```sql
-- 장소 정보 + 평점 요약 (하나의 쿼리로 처리)
SELECT
  p.id,
  p.name,
  p.address,
  p.category,
  p.latitude,
  p.longitude,
  COALESCE(AVG(r.rating), 0) AS average_rating,
  COUNT(r.id) AS review_count
FROM places p
LEFT JOIN reviews r ON r.place_id = p.id
WHERE p.id = :place_id
GROUP BY p.id;
```

**Supabase 클라이언트 코드**:
```typescript
// 장소 정보 조회
const { data: place, error: placeError } = await supabase
  .from('places')
  .select('*')
  .eq('id', placeId)
  .single();

// 평점 요약 (집계 쿼리)
const { data: reviews } = await supabase
  .from('reviews')
  .select('rating')
  .eq('place_id', placeId);

const averageRating = reviews?.length
  ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  : 0;
const reviewCount = reviews?.length ?? 0;

// 또는 RPC 함수로 처리:
// CREATE FUNCTION get_place_with_rating(place_id UUID) ...
```

**출력**:
```typescript
{
  place: {
    id: string;
    name: string;
    address: string;
    category: string;
    latitude: number;
    longitude: number;
    averageRating: number;  // 소수점 1자리
    reviewCount: number;
  }
}
```

---

### 3.4 리뷰 목록 조회 (장소별)

**입력**: 장소 ID (placeId), 페이지 번호 (page), 페이지 크기 (limit)

**SQL 쿼리**:
```sql
SELECT
  id,
  author_name,
  rating,
  content,
  created_at
FROM reviews
WHERE place_id = :place_id
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;

-- 전체 카운트
SELECT COUNT(*) FROM reviews WHERE place_id = :place_id;
```

**Supabase 클라이언트 코드**:
```typescript
const offset = (page - 1) * limit;

const { data, error, count } = await supabase
  .from('reviews')
  .select('id, author_name, rating, content, created_at', { count: 'exact' })
  .eq('place_id', placeId)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);

const hasMore = (count ?? 0) > offset + limit;
```

**출력**:
```typescript
{
  reviews: Array<{
    id: string;
    authorName: string;
    rating: number;
    content: string;
    createdAt: string;  // ISO 8601
  }>;
  total: number;
  hasMore: boolean;
}
```

---

### 3.5 리뷰 작성

**입력**: place_id, author_name, rating, content, password

**처리 단계**:
1. 장소 존재 여부 확인
   ```sql
   SELECT id FROM places WHERE id = :place_id;
   ```

2. 비밀번호 해싱 (bcrypt, 백엔드)
   ```typescript
   import bcrypt from 'bcrypt';
   const passwordHash = await bcrypt.hash(password, 10);
   ```

3. 리뷰 삽입
   ```sql
   INSERT INTO reviews (place_id, author_name, rating, content, password_hash)
   VALUES (:place_id, :author_name, :rating, :content, :password_hash)
   RETURNING id, author_name, rating, content, created_at;
   ```

**Supabase 클라이언트 코드**:
```typescript
// 1. 장소 존재 확인
const { data: place, error: placeError } = await supabase
  .from('places')
  .select('id')
  .eq('id', placeId)
  .single();

if (placeError || !place) {
  return failure('PLACE_NOT_FOUND', '장소를 찾을 수 없습니다.');
}

// 2. 비밀번호 해싱
const passwordHash = await bcrypt.hash(password, 10);

// 3. 리뷰 삽입
const { data, error } = await supabase
  .from('reviews')
  .insert({
    place_id: placeId,
    author_name: authorName,
    rating,
    content,
    password_hash: passwordHash,
  })
  .select('id, author_name, rating, content, created_at')
  .single();
```

**출력**:
```typescript
{
  review: {
    id: string;
    authorName: string;
    rating: number;
    content: string;
    createdAt: string;
  }
}
```

---

### 3.6 리뷰 수정

**입력**: review_id, password, rating (optional), content (optional)

**처리 단계**:
1. 리뷰 조회 및 비밀번호 검증
   ```sql
   SELECT id, password_hash FROM reviews WHERE id = :review_id;
   ```

2. 비밀번호 비교 (bcrypt)
   ```typescript
   const isValid = await bcrypt.compare(password, review.password_hash);
   ```

3. 검증 성공 시 리뷰 수정
   ```sql
   UPDATE reviews
   SET
     rating = COALESCE(:rating, rating),
     content = COALESCE(:content, content),
     updated_at = now()
   WHERE id = :review_id
   RETURNING id, author_name, rating, content, updated_at;
   ```

**Supabase 클라이언트 코드**:
```typescript
// 1. 리뷰 조회
const { data: review, error } = await supabase
  .from('reviews')
  .select('id, password_hash')
  .eq('id', reviewId)
  .single();

if (error || !review) {
  return failure('REVIEW_NOT_FOUND', '리뷰를 찾을 수 없습니다.');
}

// 2. 비밀번호 검증
const isValid = await bcrypt.compare(password, review.password_hash);
if (!isValid) {
  return failure('INVALID_PASSWORD', '비밀번호가 일치하지 않습니다.');
}

// 3. 리뷰 수정
const { data, error: updateError } = await supabase
  .from('reviews')
  .update({ rating, content })
  .eq('id', reviewId)
  .select('id, author_name, rating, content, updated_at')
  .single();
```

**출력**:
```typescript
{
  review: {
    id: string;
    authorName: string;
    rating: number;
    content: string;
    updatedAt: string;
  }
}
```

---

### 3.7 리뷰 삭제

**입력**: review_id, password

**처리 단계**:
1. 리뷰 조회 및 비밀번호 검증 (3.6과 동일)

2. 검증 성공 시 리뷰 삭제
   ```sql
   DELETE FROM reviews WHERE id = :review_id;
   ```

**Supabase 클라이언트 코드**:
```typescript
// 1~2. 조회 및 검증 (3.6과 동일)

// 3. 삭제
const { error: deleteError } = await supabase
  .from('reviews')
  .delete()
  .eq('id', reviewId);

if (deleteError) {
  return failure('DELETE_FAILED', '삭제에 실패했습니다.');
}

return success({ deleted: true });
```

**출력**:
```typescript
{
  deleted: true
}
```

---

## 4. 마이그레이션 SQL

### 4.1 places 테이블 생성

```sql
-- supabase/migrations/0001_create_places_table.sql

-- places 테이블 생성
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

-- 위치 기반 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_places_location
ON places (latitude, longitude);

-- 이름 검색 인덱스 (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_places_name
ON places USING gin(name gin_trgm_ops);

-- updated_at 자동 갱신 함수 (공통)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_places_updated_at
BEFORE UPDATE ON places
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (service-role 키 사용)
ALTER TABLE places DISABLE ROW LEVEL SECURITY;

-- 코멘트
COMMENT ON TABLE places IS '리뷰 작성 대상 장소 정보';
COMMENT ON COLUMN places.id IS '장소 고유 식별자';
COMMENT ON COLUMN places.name IS '장소명 (예: 이차돌 신설동점)';
COMMENT ON COLUMN places.address IS '주소';
COMMENT ON COLUMN places.category IS '카테고리 (예: 한식 > 소고기구이)';
COMMENT ON COLUMN places.latitude IS '위도 (소수점 8자리)';
COMMENT ON COLUMN places.longitude IS '경도 (소수점 8자리)';
```

---

### 4.2 reviews 테이블 생성

```sql
-- supabase/migrations/0002_create_reviews_table.sql

-- reviews 테이블 생성
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

-- place_id 기반 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_place_id
ON reviews (place_id);

-- 최신순 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
ON reviews (created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- 코멘트
COMMENT ON TABLE reviews IS '사용자가 작성한 장소 리뷰';
COMMENT ON COLUMN reviews.id IS '리뷰 고유 식별자';
COMMENT ON COLUMN reviews.place_id IS '리뷰 대상 장소 ID (FK)';
COMMENT ON COLUMN reviews.author_name IS '작성자명 (이메일 형식, 최대 20자)';
COMMENT ON COLUMN reviews.rating IS '평점 (1~5)';
COMMENT ON COLUMN reviews.content IS '리뷰 내용 (10~500자)';
COMMENT ON COLUMN reviews.password_hash IS '비밀번호 해시 (bcrypt)';
COMMENT ON COLUMN reviews.created_at IS '작성 일시';
COMMENT ON COLUMN reviews.updated_at IS '수정 일시';
```

---

### 4.3 시드 데이터 (예시)

```sql
-- supabase/migrations/0003_seed_example_places.sql

-- 예시 장소 데이터 삽입
INSERT INTO places (id, name, address, category, latitude, longitude)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '이차돌 신설동점',
    '서울특별시 종로구 종로 405 1층',
    '한식 > 소고기구이',
    37.57410000,
    127.01670000
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '이차돌 플러스 돌곶이역점',
    '서울특별시 성북구 돌곶이로 62 1층',
    '한식 > 소고기구이',
    37.59200000,
    127.05200000
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    '스타벅스 광화문점',
    '서울특별시 종로구 세종대로 172 1층',
    '카페 > 커피전문점',
    37.57037700,
    126.97633900
  )
ON CONFLICT (id) DO NOTHING;

-- 예시 리뷰 데이터 삽입
-- 주의: 실제 password_hash는 bcrypt로 생성해야 함
-- 아래는 password='test1234'의 해시값 예시
INSERT INTO reviews (place_id, author_name, rating, content, password_hash)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'user1@example.com',
    5,
    '정말 맛있었습니다. 다음에 또 올게요!',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'user2@example.com',
    4,
    '고기 질이 좋아요. 다만 웨이팅이 길었습니다.',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'user3@example.com',
    5,
    '돌곶이역 근처에서 소고기 먹기 좋은 곳입니다.',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  )
ON CONFLICT DO NOTHING;
```

---

## 5. 최적화 고려사항

### 5.1 성능 최적화

#### 5.1.1 인덱스 전략
- **위치 기반 검색**: `idx_places_location` (latitude, longitude)
  - 범위 검색 최적화
  - 향후 PostGIS 확장 고려 (정확한 거리 계산)
- **텍스트 검색**: `idx_places_name` (GIN trigram)
  - ILIKE 검색 최적화
  - 한글 검색 지원
- **리뷰 조회**: `idx_reviews_place_id`, `idx_reviews_created_at`
  - place_id 필터링 + 최신순 정렬 복합 최적화

#### 5.1.2 쿼리 최적화
- 평균 평점 계산: 애플리케이션 레벨 집계 vs DB 뷰/함수
  - 현재: 런타임 집계 (실시간 정확성)
  - 향후: Materialized View 또는 캐싱 (성능 우선)
- 페이지네이션: LIMIT/OFFSET vs Cursor 기반
  - 현재: LIMIT/OFFSET (간단한 구현)
  - 향후: Cursor (대량 데이터 시)

#### 5.1.3 데이터베이스 튜닝
- `work_mem`: 정렬 작업 메모리 할당
- `shared_buffers`: 캐시 크기 조정
- `max_connections`: 동시 접속 제한

---

### 5.2 확장성 고려사항

#### 5.2.1 샤딩 전략 (미래)
- 장소 기반 샤딩: latitude/longitude 범위별 분산
- 리뷰는 place_id 기반 코로케이션 (동일 샤드 저장)

#### 5.2.2 읽기 복제본
- 마스터: 쓰기 (리뷰 작성/수정/삭제)
- 슬레이브: 읽기 (장소 조회, 리뷰 목록)

#### 5.2.3 캐싱 레이어
- Redis: 인기 장소 정보, 평균 평점 캐싱
- CDN: 정적 지도 타일

---

### 5.3 보안 고려사항

#### 5.3.1 비밀번호 관리
- bcrypt 해싱 (cost factor: 10)
- 비밀번호 평문 저장 절대 금지
- 해시 비교는 백엔드에서만 수행

#### 5.3.2 입력 검증
- Zod 스키마 검증 (프론트엔드 + 백엔드)
- SQL Injection 방지: Supabase 파라미터 바인딩 사용
- XSS 방지: 리뷰 내용 sanitize (필요 시)

#### 5.3.3 Rate Limiting
- 리뷰 작성: IP별 제한 (예: 1시간 5개)
- 검색: IP별 제한 (예: 1분 100회)
- 비밀번호 시도: 5회 실패 시 일시 잠금

---

## 6. 모니터링 및 유지보수

### 6.1 쿼리 성능 모니터링
```sql
-- 느린 쿼리 식별
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 인덱스 사용률
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### 6.2 테이블 통계
```sql
-- 테이블 크기 및 행 수
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 6.3 정기 유지보수
- VACUUM ANALYZE: 주 1회 (통계 갱신, 공간 회수)
- REINDEX: 월 1회 (인덱스 재구성)
- 백업: 일 1회 (Supabase 자동 백업 + 추가 백업)

---

## 부록

### A. 데이터 타입 선택 근거

| 타입 | 사용처 | 이유 |
|------|--------|------|
| UUID | id (PK) | 전역 고유성, 보안성, 분산 생성 가능 |
| TEXT | name, address, content | 가변 길이, 최대 1GB, 한글 지원 |
| NUMERIC(10,8) | latitude | 소수점 8자리 정밀도 (약 1.1mm 오차) |
| NUMERIC(11,8) | longitude | 소수점 8자리 정밀도 |
| INTEGER | rating | 1~5 범위, CHECK 제약조건으로 강제 |
| TIMESTAMPTZ | created_at, updated_at | 타임존 포함, 국제화 지원 |

### B. CHECK 제약조건 목록

| 테이블 | 컬럼 | 제약조건 | 목적 |
|--------|------|----------|------|
| reviews | rating | rating >= 1 AND rating <= 5 | 평점 범위 강제 (1~5) |
| reviews | content | char_length(content) >= 10 AND <= 500 | 리뷰 길이 제한 (10~500자) |

### C. 외래 키 제약조건

| 자식 테이블 | 자식 컬럼 | 부모 테이블 | 부모 컬럼 | ON DELETE |
|-----------|----------|-----------|----------|-----------|
| reviews | place_id | places | id | CASCADE |

**의미**: 장소가 삭제되면 해당 장소의 모든 리뷰도 자동 삭제

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-10-21 | 1.0.0 | 초안 작성 | AI Agent |

---

**문서 작성 완료**
