-- places 테이블 생성
CREATE TABLE IF NOT EXISTS public.places (
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
  ON public.places (latitude, longitude);

-- 키워드 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_places_name
  ON public.places (name);

-- RLS 비활성화 (service-role 키 사용)
ALTER TABLE public.places DISABLE ROW LEVEL SECURITY;

-- 테이블 설명
COMMENT ON TABLE public.places IS '장소 정보 테이블';
COMMENT ON COLUMN public.places.id IS '장소 고유 ID';
COMMENT ON COLUMN public.places.name IS '가게명';
COMMENT ON COLUMN public.places.address IS '주소';
COMMENT ON COLUMN public.places.category IS '업종 카테고리';
COMMENT ON COLUMN public.places.latitude IS '위도 (소수점 8자리)';
COMMENT ON COLUMN public.places.longitude IS '경도 (소수점 8자리)';
