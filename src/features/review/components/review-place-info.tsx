'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import type { PlaceDetail } from '@/features/place/lib/dto';

interface ReviewPlaceInfoProps {
  place: PlaceDetail;
}

export function ReviewPlaceInfo({ place }: ReviewPlaceInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {place.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-gray-600">{place.address}</p>
        <p className="text-sm text-gray-500">{place.category}</p>
      </CardContent>
    </Card>
  );
}
