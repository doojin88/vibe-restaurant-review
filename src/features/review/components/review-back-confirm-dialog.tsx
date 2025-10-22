'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useReviewWriteContext } from '../context/review-write-context';

export function ReviewBackConfirmDialog() {
  const { state, closeBackConfirm, confirmBack } = useReviewWriteContext();

  return (
    <AlertDialog open={state.backConfirm} onOpenChange={closeBackConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>작성을 취소하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            작성 중인 내용이 있습니다. 정말 나가시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>계속 작성</AlertDialogCancel>
          <AlertDialogAction onClick={confirmBack}>나가기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
