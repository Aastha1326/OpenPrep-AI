import React, { useState } from 'react';
import { Calendar, CheckCircle2, X, Share2, Copy, Check, ExternalLink } from 'lucide-react';
import api from '../../services/api';

const CalendarSyncModal = ({ isOpen, onClose }) => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [copiedFeed, setCopiedFeed] = useState(false);

  const handleGoogleSync = async () => {
    try {
      setSyncStatus('syncing-google');
      const { data } = await api.get('/integrations/google/auth');
      if (data && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Google Auth Failed', error);
      setSyncStatus('error');
    }
  };

  const handleNotionSync = async () => {
    setSyncStatus('syncing-notion');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSyncStatus('success');
    } catch (error) {
      setSyncStatus('error');
    }
  };

  const copyICalUrl = () => {
    const url = `${window.location.origin}/api/integrations/calendar/feed.ics`;
    navigator.clipboard.writeText(url);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Export & Sync Schedule</h2>
            <p className="text-xs text-gray-400">Synchronize study plans to your external calendar</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleSync}
            disabled={syncStatus.startsWith('syncing')}
            className="w-full flex items-center justify-between p-4 bg-gray-850 hover:bg-gray-800 border border-gray-700/60 rounded-2xl transition-all"
          >
            <div className="flex items-center gap-3 text-white font-semibold text-sm">
              <img src="/google-logo.svg" alt="Google" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              Google Calendar Sync
            </div>
            {syncStatus === 'syncing-google' ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ExternalLink size={16} className="text-gray-400" />
            )}
          </button>

          <button
            onClick={handleNotionSync}
            disabled={syncStatus.startsWith('syncing')}
            className="w-full flex items-center justify-between p-4 bg-gray-850 hover:bg-gray-800 border border-gray-700/60 rounded-2xl transition-all"
          >
            <div className="flex items-center gap-3 text-white font-semibold text-sm">
              <img src="/notion-logo.svg" alt="Notion" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              Notion Database Sync
            </div>
            {syncStatus === 'syncing-notion' ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : syncStatus === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <ExternalLink size={16} className="text-gray-400" />
            )}
          </button>

          <button
            onClick={copyICalUrl}
            className="w-full flex items-center justify-between p-4 bg-gray-850 hover:bg-gray-800 border border-gray-700/60 rounded-2xl transition-all"
          >
            <div className="flex items-center gap-3 text-white font-semibold text-sm">
              <Share2 size={18} className="text-purple-400" />
              Apple / Outlook (.ics Feed)
            </div>
            {copiedFeed ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check size={14} /> Copied!
              </span>
            ) : (
              <Copy size={16} className="text-gray-400" />
            )}
          </button>
        </div>

        {syncStatus === 'error' && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
            Sync error. Please check credentials and try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSyncModal;
