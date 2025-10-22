import { z } from 'zod';

// 리뷰 기본 스키마
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string().uuid(),
  author_name: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string(),
  created_at: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;

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
  password: z.string().min(4, '비밀번호는 최소 4자입니다.'),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// 리뷰 목록 조회 요청 스키마
export const GetReviewsSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
});

export type GetReviewsQuery = z.infer<typeof GetReviewsSchema>;
