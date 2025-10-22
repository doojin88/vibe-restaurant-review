'use client';

import { Plus, Minus, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCurrentLocation: () => void;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onCurrentLocation,
}: MapControlsProps) {
  return (
    <div className="absolute right-4 top-20 z-10 flex flex-col gap-2">
      <Button
        size="icon"
        variant="outline"
        onClick={onZoomIn}
        className="bg-white shadow-md"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={onZoomOut}
        className="bg-white shadow-md"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={onCurrentLocation}
        className="bg-white shadow-md"
      >
        <Locate className="h-4 w-4" />
      </Button>
    </div>
  );
}
