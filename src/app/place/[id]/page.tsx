'use client';

import { use } from 'react';
import { PlaceInfoCard } from '@/features/place/components/place-info-card';
import { RatingSummary } from '@/features/review/components/rating-summary';
import { ReviewWriteButton } from '@/features/review/components/review-write-button';
import { ReviewList } from '@/features/review/components/review-list';

interface PlaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <PlaceInfoCard placeId={id} />
      <RatingSummary placeId={id} />
      <ReviewWriteButton placeId={id} />
      <ReviewList placeId={id} />
    </div>
  );
}
