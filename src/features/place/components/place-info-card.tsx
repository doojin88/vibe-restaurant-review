'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePlaceQuery } from '@/features/place/hooks/usePlaceQuery';

interface PlaceInfoCardProps {
  placeId: string;
}

export function PlaceInfoCard({ placeId }: PlaceInfoCardProps) {
  const { data: place, isLoading, error } = usePlaceQuery(placeId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>장소 정보를 불러올 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  if (!place) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{place.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{place.address}</p>
        <p className="text-sm font-medium">{place.category}</p>
      </CardContent>
    </Card>
  );
}
