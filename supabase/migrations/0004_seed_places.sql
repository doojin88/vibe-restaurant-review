-- 시드 장소 데이터
INSERT INTO public.places (id, name, address, category, latitude, longitude)
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

-- 시드 리뷰 데이터 (테스트용, 실제로는 bcrypt 해시 사용)
-- 비밀번호: "test1234"의 bcrypt 해시
INSERT INTO public.reviews (place_id, author_name, rating, content, password_hash, created_at)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'test@example.com',
    5,
    '고기 질이 정말 좋아요! 서비스도 친절하고 다음에 또 올게요.',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    now() - interval '1 day'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'user2@example.com',
    4,
    '맛있습니다. 조금 기다렸지만 충분히 만족스러웠어요.',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    now() - interval '2 hours'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'coffee@example.com',
    5,
    '조용하고 커피도 맛있어요. 작업하기 좋은 환경입니다.',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    now() - interval '3 days'
  )
ON CONFLICT DO NOTHING;
