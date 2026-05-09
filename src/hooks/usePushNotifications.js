import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(token) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(setRegistration).catch(() => {});
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !token || !registration) return false;

    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      // Get VAPID public key
      const { data } = await axios.get(`${API}/push/vapid-key`);
      const vapidKey = data.publicKey;
      if (!vapidKey) return false;

      // Register and subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      // Send subscription to backend
      await axios.post(`${API}/push/subscribe`, {
        subscription: subscription.toJSON()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }, [isSupported, token, registration]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !token || !registration) return;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await axios.delete(`${API}/push/unsubscribe`, {
          data: { endpoint: subscription.endpoint },
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
  }, [isSupported, token, registration]);

  const testPush = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.post(`${API}/push/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    } catch (err) {
      console.error('Test push failed:', err);
    }
  }, [token]);

  // Auto-check subscription status
  useEffect(() => {
    if (!registration) return;
    registration.pushManager.getSubscription().then((subscription) => {
      setIsSubscribed(!!subscription);
    }).catch(() => {});
  }, [registration]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    testPush
  };
}
