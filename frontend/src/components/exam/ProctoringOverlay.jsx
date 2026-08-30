/**
 * @fileoverview Full-screen overlay warning users about focus loss and tab-switching.
 */
import React, { useEffect, useState } from 'react';

const ProctoringOverlay = ({ onFocusLoss, isFullscreen }) => {
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setShowWarning(true);
                onFocusLoss();
            } else {
                setShowWarning(false);
            }
        };

        const handleBlur = () => {
            setShowWarning(true);
            onFocusLoss();
        };

        const handleFocus = () => {
            setShowWarning(false);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [onFocusLoss]);

    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-red-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <svg className="w-20 h-20 text-white mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-3xl font-bold text-white mb-4">Focus Lost Detected!</h2>
            <p className="text-xl text-red-100 mb-8 max-w-lg">
                You have switched tabs or minimized the exam window. This action has been logged and will negatively impact your proctoring integrity score.
            </p>
            <button
                onClick={() => setShowWarning(false)}
                className="px-8 py-3 bg-white text-red-900 font-bold rounded-xl hover:bg-red-50 transition-colors shadow-lg"
            >
                Return to Exam
            </button>
        </div>
    );
};

export default ProctoringOverlay;
