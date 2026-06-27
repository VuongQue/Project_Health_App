import { useEffect, useRef } from 'react';
import { useTour } from '@/src/context/TourContext';

/**
 * Đăng ký một element vào tour theo step ID.
 * Trả về ref cần gán cho View/TouchableOpacity của element đó.
 *
 * Ví dụ:
 *   const xpRef = useTourStep('xp_bar');
 *   <View ref={xpRef} ...>
 */
export function useTourStep(stepId: string) {
  const { registerRef, unregisterRef } = useTour();
  const ref = useRef<any>(null);

  useEffect(() => {
    registerRef(stepId, ref);
    return () => unregisterRef(stepId);
  }, [stepId]);

  return ref;
}
