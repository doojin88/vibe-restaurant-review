import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { success, failure } from '@/backend/http/response';
import type { CreateReviewInput, GetReviewsQuery } from './schema';
import { ReviewErrorCode } from './error';

export const ReviewService = {
  /**
   * 리뷰 작성
   */
  async createReview(
    supabase: SupabaseClient,
    placeId: string,
    input: CreateReviewInput
  ) {
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('id')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      return failure(
        404,
        ReviewErrorCode.PLACE_NOT_FOUND,
        '장소를 찾을 수 없습니다.'
      );
    }

    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(input.password, 10);
    } catch (error) {
      console.error('Password hash error:', error);
      return failure(
        500,
        ReviewErrorCode.PASSWORD_HASH_FAILED,
        '비밀번호 처리 중 오류가 발생했습니다.'
      );
    }

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
      console.error('Review insert error:', reviewError);
      return failure(
        500,
        ReviewErrorCode.REVIEW_CREATE_FAILED,
        '리뷰 작성에 실패했습니다.'
      );
    }

    const response = {
      id: review.id,
      authorName: review.author_name,
      rating: review.rating,
      content: review.content,
      createdAt: review.created_at,
    };

    return success({ review: response });
  },

  /**
   * 특정 장소의 리뷰 목록 조회
   */
  async getReviews(
    supabase: SupabaseClient,
    placeId: string,
    query: GetReviewsQuery
  ) {
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId);

    if (countError) {
      console.error('Count query error:', countError);
      return failure(
        500,
        ReviewErrorCode.REVIEW_FETCH_FAILED,
        '리뷰 조회에 실패했습니다.'
      );
    }

    const total = count ?? 0;

    const { data, error } = await supabase
      .from('reviews')
      .select('id, author_name, rating, content, created_at')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Reviews query error:', error);
      return failure(
        500,
        ReviewErrorCode.REVIEW_FETCH_FAILED,
        '리뷰 조회에 실패했습니다.'
      );
    }

    if (!data) {
      return failure(
        500,
        ReviewErrorCode.REVIEW_FETCH_FAILED,
        '리뷰 조회에 실패했습니다.'
      );
    }

    const reviews = (data as unknown as Array<{
      id: string;
      author_name: string;
      rating: number;
      content: string;
      created_at: string;
    }>).map((review) => ({
      id: review.id,
      place_id: placeId,
      author_name: review.author_name,
      rating: review.rating,
      content: review.content,
      created_at: review.created_at,
    }));

    const hasMore = total > offset + limit;

    return success({
      reviews,
      total,
      hasMore,
    });
  },
};
