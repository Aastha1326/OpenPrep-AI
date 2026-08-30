/**
 * @fileoverview Main page for uploading PYQ PDFs and reviewing auto-segmented questions.
 */
import React, { useState, useEffect } from 'react';
import QuestionSegmentationReviewer from '../components/pyq/QuestionSegmentationReviewer';
import axios from 'axios';

const PYQAutoSegmenter = () => {
    const [file, setFile] = useState(null);
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a PDF file.');
            return;
        }

        setError('');
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await axios.post(`${API_URL}/pyq/auto-segment`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.success) setJobId(response.data.jobId);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed.');
        }
    };

    useEffect(() => {
        if (!jobId) return;
        const poll = setInterval(async () => {
            try {
                const response = await axios.get(`${API_URL}/pyq/segmented-questions/${jobId}`);
                if (response.data.success) {
                    setJobStatus(response.data.data);
                    if (response.data.data.status !== 'processing') clearInterval(poll);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 2000);
        return () => clearInterval(poll);
    }, [jobId]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">PYQ Auto-Segmenter</h1>
                    <p className="text-gray-600 dark:text-gray-400">Upload scanned exam papers to automatically extract questions, diagrams, and LaTeX formulas.</p>
                </div>

                {!jobId ? (
                    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="pdf-upload" />
                                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300"><span className="text-blue-600 dark:text-blue-400">Click to upload PDF</span></p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Up to 20MB</p>
                                </label>
                            </div>
                            {file && <p className="text-center text-sm text-gray-600 dark:text-gray-400">Selected: {file.name}</p>}
                            {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-center">{error}</div>}
                            <button type="submit" disabled={!file} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors">
                                Start Segmentation
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {jobStatus?.status === 'processing' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analyzing Document Layout...</h3>
                                <p className="text-gray-600 dark:text-gray-400">Progress: {jobStatus.progress}%</p>
                            </div>
                        )}
                        {jobStatus?.status === 'completed' && jobStatus.result && (
                            <QuestionSegmentationReviewer segments={jobStatus.result} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PYQAutoSegmenter;
