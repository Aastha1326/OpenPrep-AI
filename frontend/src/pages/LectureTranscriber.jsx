/**
 * @fileoverview Main page for uploading audio and viewing AI-generated structured notes.
 */
import React, { useState, useEffect } from 'react';
import AudioTranscriptPlayer from '../components/lectures/AudioTranscriptPlayer';
import axios from 'axios';

const LectureTranscriber = () => {
    const [file, setFile] = useState(null);
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select an audio file.');
            return;
        }

        setError('');
        setJobStatus(null);

        const formData = new FormData();
        formData.append('audio', file);

        try {
            const response = await axios.post(`${API_URL}/lectures/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setJobId(response.data.jobId);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed.');
        }
    };

    // Poll for job status
    useEffect(() => {
        if (!jobId) return;

        const poll = setInterval(async () => {
            try {
                const response = await axios.get(`${API_URL}/lectures/jobs/${jobId}`);
                if (response.data.success) {
                    setJobStatus(response.data.data);
                    if (response.data.data.status === 'completed' || response.data.data.status === 'failed') {
                        clearInterval(poll);
                    }
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 2000);

        return () => clearInterval(poll);
    }, [jobId]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Lecture Transcriber</h1>
                    <p className="text-gray-600 dark:text-gray-400">Upload audio recordings to get AI-transcribed, structured notes with flashcards.</p>
                </div>

                {!jobId ? (
                    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                                <input
                                    type="file"
                                    accept=".mp3,.wav,.m4a,.aac"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="hidden"
                                    id="audio-upload"
                                />
                                <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <span className="text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MP3, WAV, M4A, AAC up to 100MB</p>
                                </label>
                            </div>

                            {file && <p className="text-center text-sm text-gray-600 dark:text-gray-400">Selected: {file.name}</p>}

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!file}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                            >
                                Start Transcription
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {jobStatus?.status === 'processing' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Processing Audio...</h3>
                                <p className="text-gray-600 dark:text-gray-400">Progress: {jobStatus.progress}%</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4 max-w-md mx-auto">
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${jobStatus.progress}%` }}></div>
                                </div>
                            </div>
                        )}

                        {jobStatus?.status === 'completed' && jobStatus.result && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AudioTranscriptPlayer
                                    audioUrl="/mock-audio.mp3"
                                    segments={jobStatus.result.transcription.segments}
                                />
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        AI Structured Notes
                                    </h3>
                                    <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
                                        <h4>Key Concepts</h4>
                                        <ul>
                                            <li>Wave-particle duality</li>
                                            <li>Double-slit experiment</li>
                                        </ul>
                                        <h4>Exam Tips</h4>
                                        <p>Focus on understanding the observer effect in quantum mechanics.</p>
                                    </div>
                                    <button className="mt-6 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        Add to Subject Flashcards
                                    </button>
                                </div>
                            </div>
                        )}

                        {jobStatus?.status === 'failed' && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-center">
                                Transcription failed: {jobStatus.error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LectureTranscriber;
