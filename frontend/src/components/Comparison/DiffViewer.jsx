/**
 * @fileoverview Component for displaying side-by-side comparison results with highlighted categories.
 */
import React from 'react';

const DiffViewer = ({ analysis }) => {
    if (!analysis) return null;

    const ImportanceBadge = ({ level }) => {
        const colors = {
            high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };
        return (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${colors[level]}`}>
                {level}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            {/* Summary Report */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Executive Summary
                </h3>
                <p className="text-blue-800 dark:text-blue-300 leading-relaxed whitespace-pre-wrap">
                    {analysis.summaryReport}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shared Concepts */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        Shared Concepts
                    </h3>
                    <ul className="space-y-3">
                        {analysis.sharedConcepts.map((item, idx) => (
                            <li key={idx} className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.concept}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contradictions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        Potential Contradictions
                    </h3>
                    {analysis.contradictions.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No direct contradictions found.</p>
                    ) : (
                        <ul className="space-y-3">
                            {analysis.contradictions.map((item, idx) => (
                                <li key={idx} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.topic}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.conflict}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Unique to A */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Unique to Document A</h3>
                    <ul className="space-y-2">
                        {analysis.uniqueToA.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <ImportanceBadge level={item.importance} />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.point}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Unique to B */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Unique to Document B</h3>
                    <ul className="space-y-2">
                        {analysis.uniqueToB.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <ImportanceBadge level={item.importance} />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DiffViewer;
