import { useEffect, useRef } from 'react';
import { subscribeToPush } from '../services/pushService';

export function usePushNotifications(userId: string | undefined) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!userId || attempted.current) return;
    if (!('Notification' in window) || Notification.permission === 'denied') return;

    attempted.current = true;
    // Delay to avoid interrupting the login flow
    const timer = setTimeout(() => {
      subscribeToPush().catch(console.error);
    }, 3000);

    return () => clearTimeout(timer);
  }, [userId]);
}
