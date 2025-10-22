'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CreateReviewSchema, type CreateReviewInput } from '../lib/dto';

export function useCreateReviewMutation(placeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      CreateReviewSchema.parse(input);

      const { data } = await apiClient.post(`/places/${placeId}/reviews`, input);

      if (!data.ok) {
        throw new Error(data.error?.message ?? '리뷰 작성 실패');
      }

      return data.data.review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place', placeId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', placeId] });
    },
  });
}
