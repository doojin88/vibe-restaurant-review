'use client';

import { use } from 'react';
import { ReviewWriteProvider } from '@/features/review/context/review-write-context';
import { ReviewWriteForm } from '@/features/review/components/review-write-form';

export default function ReviewWritePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ReviewWriteProvider placeId={id}>
      <ReviewWriteForm />
    </ReviewWriteProvider>
  );
}
