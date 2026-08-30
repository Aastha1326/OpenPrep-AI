/**
 * @fileoverview Component utilizing the Web Speech API for continuous speech recognition.
 * Provides visual feedback for listening state, transcription, and recognized commands.
 */
import React, { useState, useEffect, useRef } from 'react';

const VoiceCommandListener = ({ onCommandRecognized, currentTopic }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'listening', 'processing', 'error'
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatus('error');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop after one command for simplicity
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setStatus('listening');
            setTranscript('');
        };

        recognition.onresult = (event) => {
            const currentTranscript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setTranscript(currentTranscript);

            if (event.results[0].isFinal) {
                setStatus('processing');
                handleFinalTranscript(currentTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setStatus('error');
            setIsListening(false);
        };

        recognition.onend = () => {
            if (status === 'listening') {
                setIsListening(false);
                setStatus('idle');
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const handleFinalTranscript = async (finalTranscript) => {
        const lowerTranscript = finalTranscript.toLowerCase();

        // Local command parsing for immediate UI actions
        if (lowerTranscript.includes('next flashcard') || lowerTranscript.includes('next card')) {
            onCommandRecognized({ action: 'next_flashcard', transcript: finalTranscript });
            setStatus('idle');
            return;
        }

        if (lowerTranscript.includes('summarize') || lowerTranscript.includes('explain')) {
            // Fallback to backend for complex contextual understanding
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/voice-assistant/query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript: finalTranscript, currentTopic })
                });
                const data = await response.json();
                if (data.success) {
                    onCommandRecognized({ action: data.data.action, response: data.data.response, transcript: finalTranscript });
                }
            } catch (error) {
                console.error('Backend voice query failed:', error);
                onCommandRecognized({ action: 'error', response: 'Sorry, I could not process that command.', transcript: finalTranscript });
            }
            setStatus('idle');
            return;
        }

        // Default fallback
        onCommandRecognized({ action: 'unknown', transcript: finalTranscript });
        setStatus('idle');
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setStatus('idle');
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
                <button
                    onClick={toggleListening}
                    disabled={status === 'processing' || status === 'error'}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/40'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isListening && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                    )}
                    <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>

                <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                    {status === 'listening' ? 'Listening...' :
                        status === 'processing' ? 'Processing...' :
                            status === 'error' ? 'Microphone access denied or error' :
                                'Tap to speak a command'}
                </p>

                {transcript && (
                    <div className="mt-4 w-full p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Heard:</p>
                        <p className="text-lg text-gray-800 dark:text-gray-200 italic">"{transcript}"</p>
                    </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-2 w-full text-xs text-gray-500 dark:text-gray-400">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">"Next flashcard"</div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">"Summarize this note"</div>
                </div>
            </div>
        </div>
    );
};

export default VoiceCommandListener;
