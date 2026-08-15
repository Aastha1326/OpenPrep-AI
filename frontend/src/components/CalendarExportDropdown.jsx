import React, { useState } from 'react';
import {
  CalendarDays,
  Download,
  ExternalLink,
} from 'lucide-react';

const CalendarExportDropdown = ({
  activePlan,
  isSyncingCalendar,
  setIsSyncingCalendar,
  onExportIcs,
  onGoogleCalendar,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleGoogleCalendar = async () => {
    setIsOpen(false);

    if (!activePlan?.id) {
      return;
    }

    await onGoogleCalendar();
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSyncingCalendar}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white px-4 py-2 rounded-sm hover:from-emerald-600 hover:to-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
          title="Export calendar or add a study task to Google Calendar"
        >
          <CalendarDays
            className={`w-5 h-5 ${
              isSyncingCalendar
                ? 'animate-spin'
                : ''
            }`}
          />

          <span className="font-semibold">
            {isSyncingCalendar
              ? 'Opening Calendar...'
              : 'Export Calendar'}
          </span>

          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportIcs();
              }}
              className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              role="menuitem"
            >
              <Download
                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              />

              Download .ics File
            </button>

            <button
              type="button"
              onClick={handleGoogleCalendar}
              disabled={isSyncingCalendar}
              className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left disabled:opacity-50"
              role="menuitem"
            >
              <ExternalLink
                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              />

              Add to Google Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarExportDropdown;