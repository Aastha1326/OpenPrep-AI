import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ShieldAlert, Zap, BookOpen, ExternalLink, Check } from 'lucide-react';

/**
 * NotificationList Dropdown Component
 */
export default function NotificationList({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onSubscribePush,
  pushEnabled = false,
  onClose,
}) {
  const navigate = useNavigate();

  const handleItemClick = async (notif) => {
    if (!notif.isRead && onMarkRead) {
      await onMarkRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
    if (onClose) onClose();
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'remind':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'weakness':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'streak':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn flex flex-col">
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-600 text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && onMarkAllRead && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Push Subscription Banner */}
      {onSubscribePush && !pushEnabled && (
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-900/50 flex items-center justify-between text-xs text-indigo-200">
          <span>Enable Browser Push Alerts for study reminders?</span>
          <button
            type="button"
            onClick={onSubscribePush}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Enable
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-1">
            <Bell className="w-6 h-6 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">All caught up!</p>
            <p>No notifications at the moment.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-3.5 hover:bg-slate-850 cursor-pointer transition-colors flex items-start gap-3 relative ${
                !notif.isRead ? 'bg-indigo-950/20' : 'opacity-80'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 mt-0.5">
                {getIconForType(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-slate-100' : 'text-slate-300'}`}>
                    {notif.title}
                  </h4>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {!notif.isRead && onMarkRead && (
                <button
                  type="button"
                  title="Mark as read"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notif.id);
                  }}
                  className="p-1 text-slate-500 hover:text-indigo-400 rounded transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
