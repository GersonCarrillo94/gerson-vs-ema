import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    // PushManager accepts URL-safe base64 string directly
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });
  }

  const json = subscription.toJSON();
  const endpoint = json.endpoint!;
  const p256dh = json.keys?.['p256dh']!;
  const auth = json.keys?.['auth']!;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const { error } = await db.from('push_subscriptions').upsert(
    { endpoint, p256dh, auth },
    { onConflict: 'user_id,endpoint' },
  );

  return !error;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await db.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
}

export async function sendPushNotification(
  recipientId: string,
  title: string,
  body: string,
  url?: string,
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push-notification', {
    body: { recipientId, title, body, url },
  });
  if (error) console.error('Error enviando notificación push:', error);
}
