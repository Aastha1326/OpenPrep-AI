import React, { useState } from 'react';
import { CalendarDays, Download, RefreshCw, LogOut } from 'lucide-react';
import API from '../../services/api'; // Or use studyPlanService when available

const CalendarExportDropdown = ({ activePlanId, isSyncingCalendar, setIsSyncingCalendar, onExportIcs }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleGoogleSync = async () => {
    setIsOpen(false);
    setIsSyncingCalendar(true);
    try {
      const { data } = await API.post('/calendar/google-sync', { planId: activePlanId });
      
      if (data.authUrl) {
        // Need to authorize via popup or redirect
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const authWindow = window.open(
          data.authUrl,
          'Google Calendar Auth',
          `width=${width},height=${height},top=${top},left=${left}`
        );

        // Listen for message from popup
        const handleAuthMessage = (event) => {
          if (event.data === 'google_calendar_sync_success') {
            setIsSyncingCalendar(false);
            window.removeEventListener('message', handleAuthMessage);
            alert('Successfully synced with Google Calendar!');
          } else if (event.data === 'google_calendar_sync_error') {
            setIsSyncingCalendar(false);
            window.removeEventListener('message', handleAuthMessage);
            alert('Failed to sync with Google Calendar.');
          }
        };
        window.addEventListener('message', handleAuthMessage);
        
        // Polling to see if user closed window
        const pollTimer = window.setInterval(() => {
          if (authWindow.closed !== false) {
            window.clearInterval(pollTimer);
            window.removeEventListener('message', handleAuthMessage);
            setIsSyncingCalendar(false);
          }
        }, 200);

      } else if (data.success) {
        setIsSyncingCalendar(false);
        alert('Successfully synced with Google Calendar!');
      }
    } catch (err) {
      console.error('Google sync failed:', err);
      setIsSyncingCalendar(false);
      const errMsg = err.response?.data?.error || 'Failed to sync with Google Calendar';
      alert(errMsg);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSyncingCalendar}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white px-4 py-2 rounded-sm hover:from-emerald-600 hover:to-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
          title="Export calendar file or Sync with Google Calendar"
        >
          <CalendarDays className={`w-5 h-5 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
          <span className="font-semibold">
            {isSyncingCalendar ? 'Syncing...' : 'Export Calendar'}
          </span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={() => {
                setIsOpen(false);
                onExportIcs();
              }}
              className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              role="menuitem"
            >
              <Download className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
              Download .ics File
            </button>
            <button
              onClick={handleGoogleSync}
              className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              role="menuitem"
            >
              <RefreshCw className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
              Sync to Google Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarExportDropdown;
