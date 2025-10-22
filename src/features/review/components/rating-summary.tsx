'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { usePlaceQuery } from '@/features/place/hooks/usePlaceQuery';

interface RatingSummaryProps {
  placeId: string;
}

export function RatingSummary({ placeId }: RatingSummaryProps) {
  const { data: place } = usePlaceQuery(placeId);

  if (!place) {
    return null;
  }

  const { averageRating, reviewCount } = place;

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
            <span className="ml-2 text-3xl font-bold">
              {averageRating.toFixed(1)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {reviewCount}개의 리뷰
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
