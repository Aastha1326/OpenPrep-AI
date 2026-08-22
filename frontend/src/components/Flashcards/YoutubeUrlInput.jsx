/**
 * @fileoverview Input component for YouTube URL with validation and loading states.
 */
import React, { useState } from 'react';

const YoutubeUrlInput = ({ onGenerate, isGenerating }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!url.trim()) {
            setError('Please enter a YouTube URL.');
            return;
        }
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            setError('Invalid YouTube URL format.');
            return;
        }
        setError('');
        onGenerate(url);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    YouTube Lecture URL
                </label>
                <div className="flex gap-2">
                    <input
                        id="youtube-url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={`flex-1 px-4 py-3 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                        disabled={isGenerating}
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !url.trim()}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Generate'
                        )}
                    </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Note: We will extract the transcript and generate flashcards. This may take a few moments for long videos.
            </p>
        </form>
    );
};

export default YoutubeUrlInput;
