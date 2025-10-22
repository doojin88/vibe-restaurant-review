'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReviewWriteContext } from '../context/review-write-context';

export function ReviewFormFields() {
  const {
    state,
    setAuthorName,
    setRating,
    setContent,
    setPassword,
    getCharacterCount,
  } = useReviewWriteContext();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="authorName">
          작성자명 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="authorName"
          type="email"
          placeholder="email@example.com"
          value={state.authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={20}
          disabled={state.submitting}
        />
        {state.authorNameError && (
          <p className="text-sm text-red-500">{state.authorNameError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          평점 <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              disabled={state.submitting}
              className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
            >
              <Star
                className={cn(
                  'h-8 w-8',
                  star <= state.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
        {state.ratingError && (
          <p className="text-sm text-red-500">{state.ratingError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">
          리뷰 내용 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          placeholder="방문하신 장소에 대한 경험을 자유롭게 작성해주세요. (최소 10자)"
          value={state.content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={5}
          disabled={state.submitting}
        />
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">최소 10자, 최대 500자</span>
          <span
            className={cn(
              getCharacterCount() > 500 ? 'text-red-500' : 'text-gray-500'
            )}
          >
            {getCharacterCount()} / 500
          </span>
        </div>
        {state.contentError && (
          <p className="text-sm text-red-500">{state.contentError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          비밀번호 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="수정/삭제 시 사용할 비밀번호 (최소 4자)"
          value={state.password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={state.submitting}
        />
        <p className="text-sm text-gray-500">
          리뷰 수정/삭제 시 필요합니다. 잊지 말아주세요!
        </p>
        {state.passwordError && (
          <p className="text-sm text-red-500">{state.passwordError}</p>
        )}
      </div>
    </>
  );
}
