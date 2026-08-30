/**
 * @fileoverview Component for displaying and formatting citations in multiple academic styles.
 */
import React, { useState } from 'react';

const CitationFormatter = ({ citationData, onCopy }) => {
    const [style, setStyle] = useState('APA');

    const formatText = (data, currentStyle) => {
        const { author, year, title, publisher, url, sourceType } = data;
        const authorFormatted = author === 'Unknown' ? 'Unknown Author' : author;
        const yearFormatted = year === 'Unknown' ? 'n.d.' : (currentStyle === 'APA' ? `(${year})` : year);
        const titleFormatted = (sourceType === 'journal' || sourceType === 'website') ? title : `"${title}"`;
        const publisherFormatted = publisher === 'Unknown' ? '' : publisher;

        switch (currentStyle) {
            case 'APA':
                return `${authorFormatted} ${yearFormatted}. ${title}. ${publisherFormatted}. ${url ? `Retrieved from ${url}` : ''}`.replace(/\s+/g, ' ').trim();
            case 'MLA':
                return `${authorFormatted}. ${titleFormatted} ${publisherFormatted}, ${year === 'Unknown' ? 'n.d.' : year}. ${url ? `Web. ${url}` : ''}`.replace(/\s+/g, ' ').trim();
            case 'Chicago':
                return `${authorFormatted}. ${titleFormatted} ${publisherFormatted}, ${year === 'Unknown' ? 'n.d.' : year}. ${url ? `Accessed via ${url}` : ''}`.replace(/\s+/g, ' ').trim();
            default:
                return `${authorFormatted}. ${title}. ${publisher}, ${year}.`;
        }
    };

    const formattedCitation = formatText(citationData, style);

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex justify-between items-center mb-4">
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    {['APA', 'MLA', 'Chicago'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStyle(s)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${style === s
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onCopy(formattedCitation)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy
                </button>
            </div>

            <div className="relative">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed pl-4 border-l-4 border-blue-500 italic">
                    {formattedCitation}
                </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Source Type</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{citationData.sourceType}</span>
                </div>
                <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Project</span>
                    <span className="font-medium text-gray-900 dark:text-white">{citationData.project || 'Unassigned'}</span>
                </div>
            </div>
        </div>
    );
};

export default CitationFormatter;
