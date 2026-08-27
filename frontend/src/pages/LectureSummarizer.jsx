/**
 * @fileoverview Main page for inputting video URLs and viewing/exporting summaries.
 */
import React, { useState } from 'react';
import VideoSummaryPlayer from '../components/Lectures/VideoSummaryPlayer';
import axios from 'axios';

const LectureSummarizer = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleSummarize = async (e) => {
        e.preventDefault();
        if (!videoUrl.trim()) {
            setError('Please enter a valid video URL.');
            return;
        }

        setIsProcessing(true);
        setError('');
        setSummaryData(null);

        try {
            const response = await axios.post(`${API_URL}/lecture-summaries/generate`, { videoUrl });
            if (response.data.success) {
                setSummaryData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to generate summary.');
            }
        } catch (err) {
            console.error('Summarization error:', err);
            setError(err.response?.data?.message || 'Network error. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportMarkdown = () => {
        if (!summaryData) return;

        let mdContent = `# ${summaryData.title}\n\n`;
        mdContent += `**Overview:** ${summaryData.overview}\n\n`;
        mdContent += `## Key Points\n\n`;

        summaryData.keyPoints.forEach(point => {
            mdContent += `### [${point.timestamp}] ${point.heading}\n`;
            mdContent += `${point.summary}\n\n`;
        });

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${summaryData.title.replace(/\s+/g, '_')}_Notes.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Lecture Summarizer</h1>
                    <p className="text-gray-600 dark:text-gray-400">Paste a YouTube lecture URL to get an AI-generated, timestamped summary.</p>
                </div>

                {!summaryData ? (
                    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                        <form onSubmit={handleSummarize} className="space-y-6">
                            <div>
                                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    YouTube Lecture URL
                                </label>
                                <input
                                    id="videoUrl"
                                    type="url"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    required
                                />
                                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing || !videoUrl.trim()}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Extracting & Summarizing...
                                    </>
                                ) : (
                                    'Generate Summary'
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <VideoSummaryPlayer
                        videoId={summaryData.videoId}
                        summaryData={summaryData}
                        onExport={handleExportMarkdown}
                    />
                )}
            </div>
        </div>
    );
};

export default LectureSummarizer;
