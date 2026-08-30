/**
 * @fileoverview Custom audio recording component using the Web MediaRecorder API.
 * Handles microphone permissions, recording state, and audio blob generation.
 */
import React, { useState, useRef, useEffect } from 'react';

const VivaRecorder = ({ onRecordingComplete, isProcessing }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // Request microphone permission on mount
    useEffect(() => {
        const requestPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setPermissionGranted(true);
                // Stop the stream immediately, we only needed it to check permission
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.error('Microphone permission denied:', err);
                setPermissionGranted(false);
            }
        };
        requestPermission();
    }, []);

    // Timer logic for recording duration
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob);
                // Clean up tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            setPermissionGranted(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (permissionGranted === false) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                Microphone access is required for the viva simulator. Please enable it in your browser settings.
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${isRecording ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                {isRecording ? (
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <rect x="6" y="6" width="8" height="8" rx="1" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                )}
            </div>

            <div className="text-2xl font-mono font-semibold text-gray-800 dark:text-gray-100 mb-6">
                {formatTime(recordingTime)}
            </div>

            <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`px-8 py-3 rounded-full font-semibold text-white transition-all duration-200 flex items-center gap-2 ${isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isRecording
                            ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                    }`}
            >
                {isProcessing ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </>
                ) : isRecording ? (
                    'Stop Recording'
                ) : (
                    'Start Speaking'
                )}
            </button>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                {isRecording
                    ? 'Speak clearly. Click stop when you are finished.'
                    : 'Click the button above and answer the question aloud.'}
            </p>
        </div>
    );
};

export default VivaRecorder;
