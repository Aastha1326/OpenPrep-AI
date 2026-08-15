import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCircle2, Clock, Trophy, Target, FileText, Bell } from 'lucide-react';

const getIcon = (type) => {
  switch (type) {
    case 'remind':
    case 'task_due':
      return <Clock className="w-5 h-5 text-blue-500" />;
    case 'badge_earned':
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 'ai_quiz':
      return <FileText className="w-5 h-5 text-purple-500" />;
    case 'streak_risk':
      return <Target className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const NotificationDropdown = ({
  isOpen,
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => onMarkAsRead(notif)}
                      className={`
                        p-4 border-b border-slate-50 last:border-b-0 cursor-pointer
                        transition-all duration-200 flex gap-3 items-start
                        ${notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'}
                      `}
                    >
                      <div className="shrink-0 mt-0.5 bg-white rounded-full p-2 shadow-sm border border-slate-100">
                        {getIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className={`text-sm font-medium truncate ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-2 ${notif.isRead ? 'text-slate-500' : 'text-slate-700'}`}>
                          {notif.message}
                        </p>
                      </div>

                      {!notif.isRead && (
                        <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-center">
              <button 
                onClick={onClose}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
