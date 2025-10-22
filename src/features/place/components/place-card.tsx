'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';
import type { Place } from '../lib/dto';

interface PlaceCardProps {
  place: Place;
  onCardClick?: (place: { id: string }) => void;
  onReviewClick?: (place: { id: string }) => void;
  averageRating?: number;
  reviewCount?: number;
  showReviewButton?: boolean;
}

export function PlaceCard({
  place,
  onCardClick,
  onReviewClick,
  averageRating,
  reviewCount,
  showReviewButton = true,
}: PlaceCardProps) {
  const handleCardClick = () => {
    onCardClick?.(place);
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReviewClick?.(place);
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-lg"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold">{place.name}</CardTitle>
          {averageRating !== undefined && reviewCount !== undefined && reviewCount > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>
        <CardDescription className="flex items-start gap-1">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{place.address}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">{place.category}</Badge>
      </CardContent>
      {showReviewButton && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReviewClick}
            className="w-full"
          >
            리뷰 작성
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
