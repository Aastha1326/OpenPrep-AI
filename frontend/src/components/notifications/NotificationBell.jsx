import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import NotificationList from './NotificationList';
import { getNotifications, markNotificationRead, markAllNotificationsRead, subscribePushNotifications } from '../../services/api';

/**
 * NotificationBell Navigation Component
 * Listens to Socket.io real-time notifications, displays unread count badge,
 * announces new alerts to screen readers via ARIA live region, and handles Web Push subscription.
 */
export default function NotificationBell({ socket, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    checkPushSubscription();
  }, []);

  // Socket.io Listener for Real-Time NOTIF_NEW events
  useEffect(() => {
    if (!socket || !userId) return;

    // Join user socket room
    socket.emit('join_user_room', userId);

    const handleNewNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      // Screen reader announcement via ARIA live region
      setAriaAnnouncement(`New notification: ${notif.title}. ${notif.message}`);
    };

    socket.on('NOTIF_NEW', handleNewNotif);

    return () => {
      socket.off('NOTIF_NEW', handleNewNotif);
    };
  }, [socket, userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data?.data || res.data || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  const checkPushSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setPushEnabled(true);
      }
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Error marking all read:', err);
    }
  };

  const handleSubscribePush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Web Push is not supported in this browser environment.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Browser push notification permission denied.');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY ||
            'BEl62iUYgUivxIkv69yViEuiBIa45ffc77g0N7i431r9g0p89a5_mock_public_key'
        ),
      });

      const subData = JSON.parse(JSON.stringify(sub));
      await subscribePushNotifications({
        endpoint: subData.endpoint,
        keys: subData.keys,
      });

      setPushEnabled(true);
      alert('Desktop Push Notifications successfully enabled!');
    } catch (err) {
      console.error('Failed to subscribe push notifications:', err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Screen Reader ARIA Live Announcement Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {ariaAnnouncement}
      </div>

      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications - ${unreadCount} unread`}
        className="relative p-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl transition-all border border-slate-700/50"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-600 text-white shadow-lg ring-2 ring-slate-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50">
          <NotificationList
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onSubscribePush={handleSubscribePush}
            pushEnabled={pushEnabled}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

// Utility to convert VAPID key string to Uint8Array
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
