import React, { useState, useEffect } from 'react';

// Utility to convert Base64 URL-safe strings to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

export default function PushSubscriptionBanner() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Check for Service Worker and Push API support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      
      // Check existing subscription status
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          if (subscription) {
            setIsSubscribed(true);
          }
        });
      });
    }

    if (localStorage.getItem('openprep_push_banner_dismissed')) {
      setIsDismissed(true);
    }
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      // Get VAPID public key from backend
      const response = await fetch('/api/notifications/vapid-key');
      const { publicKey } = await response.json();

      const registration = await navigator.serviceWorker.ready;

      // Ask for permission and subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send the subscription object to the backend
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      setIsSubscribed(true);
      console.log('Successfully subscribed to Smart Reminders.');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      if (Notification.permission === 'denied') {
        alert('Push notifications are blocked by your browser settings.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('openprep_push_banner_dismissed', 'true');
    setIsDismissed(true);
  };

  if (!isSupported || isSubscribed || isDismissed) {
    return null;
  }

  return (
    <div className="bg-indigo-600 px-4 py-3 text-white sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center">
        <span className="flex rounded-lg bg-indigo-800 p-2">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </span>
        <p className="ml-3 font-medium truncate">
          <span className="hidden md:inline">Boost your retention with Smart AI Revision Reminders! </span>
          <span className="md:hidden">Enable Smart AI Reminders!</span>
        </p>
      </div>
      <div className="mt-4 sm:ml-4 sm:mt-0 sm:flex-shrink-0 flex gap-2">
        <button
          onClick={handleSubscribe}
          disabled={isSubscribing}
          className="flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
        >
          {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
        </button>
        <button
          onClick={handleDismiss}
          className="flex p-2 rounded-md hover:bg-indigo-500 focus:outline-none"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
