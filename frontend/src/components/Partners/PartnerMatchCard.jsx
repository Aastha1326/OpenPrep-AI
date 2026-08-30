/**
 * @fileoverview Card component displaying a potential study partner's match score and details.
 */
import React, { useState } from 'react';

const PartnerMatchCard = ({ partner, onRequestSent }) => {
    const [isRequesting, setIsRequesting] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);

    const handleRequest = async () => {
        setIsRequesting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setHasRequested(true);
        setIsRequesting(false);
        onRequestSent(partner.id);
    };

    const scoreColor = partner.compatibility.score >= 80 ? 'text-green-600 dark:text-green-400' :
        partner.compatibility.score >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-gray-600 dark:text-gray-400';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg">
                        {partner.avatar}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{partner.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{partner.subjects.join(', ')}</p>
                    </div>
                </div>
                <div className="text-center">
                    <span className={`text-2xl font-extrabold ${scoreColor}`}>{partner.compatibility.score}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Match</span>
                </div>
            </div>

            <div className="space-y-2 mb-6 flex-1">
                {partner.compatibility.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>{detail}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={handleRequest}
                disabled={isRequesting || hasRequested}
                className={`w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${hasRequested
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
            >
                {isRequesting ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : hasRequested ? (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Request Sent
                    </>
                ) : (
                    'Send Partner Request'
                )}
            </button>
        </div>
    );
};

export default PartnerMatchCard;
