import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const PUBLIC_VAPID_KEY = 'BESr3cp_3Bk10gmVyNRhAkJmJE2Vk9H8ro2n-azq1FjHOjiGC7x_PScZb6cWZD_TIJa7z_z2LKH_SAYl1aSr3r0'; // Get from .env in real app

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    async function registerServiceWorker() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('[Push] Service Worker registered via App');
          
          if (user) {
             // Ask Permission
             const permission = await Notification.requestPermission();
             if (permission === 'granted') {
                 subscribeUser(registration, user.id);
             }
          }
        } catch (error) {
          console.error('[Push] SW Registration failed:', error);
        }
      }
    }

    async function subscribeUser(registration: ServiceWorkerRegistration, userId: string) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            console.log('[Push] User Subscribed:', subscription);

            // Send to Backend
            // In a real app, use the API URL from .env
            const response = await fetch('https://sellhubshop-backend.onrender.com/api/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify({ userId, subscription }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('[Push] Failed to save subscription on backend');
            } else {
                console.log('[Push] Subscription saved on backend');
            }

        } catch (err) {
            console.error('[Push] Failed to subscribe user:', err);
        }
    }

    if (user) {
       registerServiceWorker();
    }
  }, [user]);

  return null; // This component handles logic only
}
