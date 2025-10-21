# 데이터베이스 설계 명세

## 문서 개요
본 문서는 Restaurant Review 서비스의 데이터베이스 스키마를 정의합니다.
**오버엔지니어링을 철저히 배제**하고, 유저플로우에 명시된 기능만을 위한 최소한의 설계를 제공합니다.

---

## 설계 원칙

1. **최소주의**: 유저플로우에 명시적으로 포함된 데이터만 저장
2. **계산 가능한 값은 저장하지 않음**: 평균 평점, 리뷰 개수 등은 쿼리 시 계산
3. **간결성**: 불필요한 트리거, 인덱스, 제약조건 최소화
4. **확장성**: 향후 필요 시 추가 가능한 구조

---

## 데이터 플로우

### 1. 장소 탐색 플로우
```
사용자 → 홈 화면 → 지도 SDK → [places 테이블 조회]
                                ↓
                    리뷰 존재 장소 필터링
                                ↓
                            마커 표시
```

### 2. 검색 플로우
```
사용자 → 키워드 입력 → [places 테이블 LIKE 검색]
                            ↓
                        검색 결과 표시
```

### 3. 리뷰 작성 플로우
```
사용자 → 리뷰 폼 작성 → [reviews 테이블 INSERT]
                            ↓
                  비밀번호 bcrypt 해싱 저장
```

### 4. 장소 상세 플로우
```
사용자 → 장소 클릭 → [places + reviews JOIN 조회]
                            ↓
                  평균 평점 및 리뷰 목록 계산
```

---

## ERD

```
┌─────────────────────────────────────────────────┐
│                   places                        │
├─────────────────────────────────────────────────┤
│ id           UUID PRIMARY KEY                   │
│ name         TEXT NOT NULL                      │
│ address      TEXT NOT NULL                      │
│ category     TEXT NOT NULL                      │
│ latitude     NUMERIC(10,8) NOT NULL             │
│ longitude    NUMERIC(11,8) NOT NULL             │
│ created_at   TIMESTAMPTZ DEFAULT now()          │
└──────────────────┬──────────────────────────────┘
                   │
                   │ 1:N
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│                  reviews                        │
├─────────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY                  │
│ place_id      UUID → places.id (CASCADE)        │
│ author_name   TEXT NOT NULL                     │
│ rating        INTEGER CHECK (1-5)               │
│ content       TEXT CHECK (10-500자)             │
│ password_hash TEXT NOT NULL                     │
│ created_at    TIMESTAMPTZ DEFAULT now()         │
└─────────────────────────────────────────────────┘
```

---

## 테이블 상세

### 1. places

장소 기본 정보를 저장합니다.

| 컬럼명     | 타입              | 제약조건                  | 설명                     |
|-----------|-------------------|--------------------------|--------------------------|
| id        | UUID              | PRIMARY KEY, DEFAULT gen_random_uuid() | 장소 고유 ID |
| name      | TEXT              | NOT NULL                  | 가게명                   |
| address   | TEXT              | NOT NULL                  | 주소                     |
| category  | TEXT              | NOT NULL                  | 업종 카테고리            |
| latitude  | NUMERIC(10,8)     | NOT NULL                  | 위도 (소수점 8자리)      |
| longitude | NUMERIC(11,8)     | NOT NULL                  | 경도 (소수점 8자리)      |
| created_at| TIMESTAMPTZ       | NOT NULL DEFAULT now()    | 생성 일시                |

**인덱스:**
- `idx_places_location`: (latitude, longitude) - 위치 기반 검색용
- `idx_places_name`: (name) - 키워드 검색용 (LIKE 쿼리)

**비고:**
- `updated_at` 컬럼 제거: 장소 정보는 거의 수정되지 않음, 불필요
- `averageRating`, `reviewCount` 제거: 쿼리 시 계산
- RLS 비활성화 (service-role 키 사용)

---

### 2. reviews

리뷰 데이터를 저장합니다.

| 컬럼명         | 타입         | 제약조건                              | 설명                        |
|---------------|--------------|--------------------------------------|----------------------------|
| id            | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid() | 리뷰 고유 ID               |
| place_id      | UUID         | NOT NULL, REFERENCES places(id) ON DELETE CASCADE | 장소 ID (외래키) |
| author_name   | TEXT         | NOT NULL                              | 작성자명 (이메일 형식)     |
| rating        | INTEGER      | NOT NULL, CHECK (rating BETWEEN 1 AND 5) | 평점 (1~5)        |
| content       | TEXT         | NOT NULL, CHECK (char_length(content) BETWEEN 10 AND 500) | 리뷰 내용 |
| password_hash | TEXT         | NOT NULL                              | bcrypt 해싱된 비밀번호     |
| created_at    | TIMESTAMPTZ  | NOT NULL DEFAULT now()                | 작성 일시                  |

**인덱스:**
- `idx_reviews_place_id`: (place_id) - 장소별 리뷰 조회 최적화
- `idx_reviews_created_at`: (created_at DESC) - 최신순 정렬 최적화

**비고:**
- `updated_at` 컬럼 제거: 리뷰 수정 빈도 낮음, 필요 시 추가
- RLS 비활성화

---

## SQL 마이그레이션

### Migration 0001: places 테이블 생성

```sql
-- supabase/migrations/0001_create_places_table.sql

CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 위치 기반 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_places_location
  ON places (latitude, longitude);

-- 키워드 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_places_name
  ON places (name);

-- RLS 비활성화
ALTER TABLE places DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE places IS '장소 정보 테이블';
COMMENT ON COLUMN places.id IS '장소 고유 ID';
COMMENT ON COLUMN places.name IS '가게명';
COMMENT ON COLUMN places.address IS '주소';
COMMENT ON COLUMN places.category IS '업종 카테고리';
COMMENT ON COLUMN places.latitude IS '위도 (소수점 8자리)';
COMMENT ON COLUMN places.longitude IS '경도 (소수점 8자리)';
```

---

### Migration 0002: reviews 테이블 생성

```sql
-- supabase/migrations/0002_create_reviews_table.sql

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL CHECK (
    char_length(content) >= 10 AND
    char_length(content) <= 500
  ),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 장소별 리뷰 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_place_id
  ON reviews (place_id);

-- 최신순 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
  ON reviews (created_at DESC);

-- RLS 비활성화
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE reviews IS '리뷰 테이블';
COMMENT ON COLUMN reviews.id IS '리뷰 고유 ID';
COMMENT ON COLUMN reviews.place_id IS '장소 ID (외래키)';
COMMENT ON COLUMN reviews.author_name IS '작성자명 (이메일 형식)';
COMMENT ON COLUMN reviews.rating IS '평점 (1~5)';
COMMENT ON COLUMN reviews.content IS '리뷰 내용 (10~500자)';
COMMENT ON COLUMN reviews.password_hash IS 'bcrypt 해싱된 비밀번호';
```

---

### Migration 0003: 시드 데이터

```sql
-- supabase/migrations/0003_seed_places.sql

INSERT INTO places (id, name, address, category, latitude, longitude)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '이차돌 신설동점',
    '서울특별시 종로구 종로 405 1층',
    '한식 > 소고기구이',
    37.57410000,
    127.01670000
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '이차돌 플러스 돌곶이역점',
    '서울특별시 성북구 돌곶이로 62 1층',
    '한식 > 소고기구이',
    37.59200000,
    127.05200000
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '스타벅스 강남R점',
    '서울특별시 강남구 강남대로 390',
    '카페',
    37.49760000,
    127.02770000
  )
ON CONFLICT (id) DO NOTHING;
```

---

## 주요 쿼리 패턴

### 1. 주변 장소 조회 (리뷰 존재 장소만)

```sql
SELECT DISTINCT
  p.id,
  p.name,
  p.address,
  p.category,
  p.latitude,
  p.longitude
FROM places p
INNER JOIN reviews r ON p.id = r.place_id
WHERE
  p.latitude BETWEEN :min_lat AND :max_lat
  AND p.longitude BETWEEN :min_lng AND :max_lng
LIMIT 100;
```

**설명**: 리뷰가 최소 1개 이상 있는 장소만 조회 (마커 표시용)

---

### 2. 키워드 검색

```sql
SELECT
  id,
  name,
  address,
  category,
  latitude,
  longitude
FROM places
WHERE name ILIKE '%' || :keyword || '%'
ORDER BY name
LIMIT 10 OFFSET :offset;
```

**설명**: `idx_places_name` 인덱스 활용

---

### 3. 장소 상세 + 평균 평점 조회

```sql
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
LEFT JOIN reviews r ON p.id = r.place_id
WHERE p.id = :place_id
GROUP BY p.id;
```

**설명**: 평균 평점 및 리뷰 개수를 실시간 계산

---

### 4. 특정 장소의 리뷰 목록 조회

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
LIMIT 10 OFFSET :offset;
```

**설명**: `idx_reviews_place_id`, `idx_reviews_created_at` 인덱스 활용

---

### 5. 리뷰 작성

```sql
INSERT INTO reviews (place_id, author_name, rating, content, password_hash)
VALUES (:place_id, :author_name, :rating, :content, :password_hash)
RETURNING id, author_name, rating, content, created_at;
```

---

### 6. 리뷰 삭제 (비밀번호 검증 후)

```sql
-- 비밀번호 검증
SELECT password_hash FROM reviews WHERE id = :review_id;

-- 백엔드에서 bcrypt.compare() 수행 후 일치하면 삭제
DELETE FROM reviews WHERE id = :review_id;
```

---

## 확장 고려사항 (현재는 미구현)

향후 필요 시 다음 기능을 추가할 수 있습니다:

1. **리뷰 수정 기능**: `updated_at` 컬럼 추가
2. **리뷰 이미지**: `review_images` 테이블 추가 (1:N)
3. **사용자 인증**: `users` 테이블 추가, `reviews.user_id` 외래키
4. **좋아요/신고**: `review_likes`, `review_reports` 테이블
5. **장소 소유자 인증**: `place_owners` 테이블

**중요**: 이러한 기능들은 현재 요구사항에 **명시되지 않았으므로 구현하지 않습니다.**

---

## 성능 최적화

### 인덱스 전략
- **필수 인덱스만 생성**: 과도한 인덱스는 INSERT/UPDATE 성능 저하
- **실제 쿼리 패턴 기반**: 유저플로우에서 확인된 쿼리만 최적화

### 비정규화 금지
- 평균 평점, 리뷰 개수 등 **계산 가능한 값은 저장하지 않음**
- 필요 시 쿼리 시 계산 (PostgreSQL 집계 함수 충분히 빠름)
- 데이터 불일치 위험 제거

### RLS 비활성화
- 비로그인 서비스이므로 RLS 불필요
- service-role 키로 모든 작업 수행
- 성능상 이점

---

## 마이그레이션 적용 방법

1. Supabase Dashboard → SQL Editor 접속
2. 각 마이그레이션 파일을 순서대로 실행:
   - `0001_create_places_table.sql`
   - `0002_create_reviews_table.sql`
   - `0003_seed_places.sql`
3. 실행 결과 확인

---

## 변경 이력

| 날짜       | 버전  | 변경 내용               | 작성자  |
|-----------|-------|------------------------|---------|
| 2025-10-21| 1.0.0 | 초안 작성 (최소주의 설계) | AI Agent |

---

**문서 작성 완료**
