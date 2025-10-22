'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface ReviewWriteButtonProps {
  placeId: string;
}

export function ReviewWriteButton({ placeId }: ReviewWriteButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/place/${placeId}/review`);
  };

  return (
    <Button onClick={handleClick} className="mt-4 w-full" size="lg">
      <PlusCircle className="mr-2 h-5 w-5" />
      리뷰 작성
    </Button>
  );
}
