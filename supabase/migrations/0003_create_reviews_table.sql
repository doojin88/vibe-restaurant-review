-- reviews 테이블 생성
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
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
  ON public.reviews (place_id);

-- 최신순 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
  ON public.reviews (created_at DESC);

-- RLS 비활성화
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- 테이블 설명
COMMENT ON TABLE public.reviews IS '리뷰 테이블';
COMMENT ON COLUMN public.reviews.id IS '리뷰 고유 ID';
COMMENT ON COLUMN public.reviews.place_id IS '장소 ID (외래키)';
COMMENT ON COLUMN public.reviews.author_name IS '작성자명 (이메일 형식)';
COMMENT ON COLUMN public.reviews.rating IS '평점 (1~5)';
COMMENT ON COLUMN public.reviews.content IS '리뷰 내용 (10~500자)';
COMMENT ON COLUMN public.reviews.password_hash IS 'bcrypt 해싱된 비밀번호';
