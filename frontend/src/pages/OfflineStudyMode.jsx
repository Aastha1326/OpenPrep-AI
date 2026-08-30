/**
 * @fileoverview Main page demonstrating offline-first study capabilities.
 */
import React, { useState, useEffect } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import OfflineStatusIndicator from '../components/Offline/OfflineStatusIndicator';
import { getAllItems, addItem, STORES } from '../utils/indexedDBManager';

const OfflineStudyMode = () => {
    const { isOnline, isSyncing, queueLength, queueAction, triggerSync } = useOfflineSync();
    const [flashcards, setFlashcards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Load cached flashcards on mount
    useEffect(() => {
        const loadCachedCards = async () => {
            const cached = await getAllItems(STORES.FLASHCARDS);
            if (cached.length > 0) {
                setFlashcards(cached);
            } else {
                // Seed mock data if empty
                const mockCards = [
                    { id: '1', front: 'What is the capital of France?', back: 'Paris' },
                    { id: '2', front: 'What is the time complexity of binary search?', back: 'O(log n)' },
                ];
                for (const card of mockCards) {
                    await addItem(STORES.FLASHCARDS, card);
                }
                setFlashcards(mockCards);
            }
        };
        loadCachedCards();
    }, []);

    const handleReview = async (quality) => {
        const card = flashcards[currentCardIndex];

        // Queue the review action for sync
        await queueAction('flashcard_review', {
            cardId: card.id,
            quality,
            timestamp: Date.now(),
        });

        // Move to next card
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
        }, 200);
    };

    if (flashcards.length === 0) return null;

    const currentCard = flashcards[currentCardIndex];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200 relative">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Offline Study Mode</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {isOnline
                            ? 'You are online. Your progress will sync automatically.'
                            : 'You are offline. Your progress is saved locally and will sync when you reconnect.'}
                    </p>
                </div>

                {/* Flashcard */}
                <div className="perspective-1000 h-80 mb-8 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                    <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center p-8">
                            <p className="text-2xl font-semibold text-center text-gray-900 dark:text-white">{currentCard.front}</p>
                            <span className="absolute bottom-4 right-4 text-xs text-gray-400 dark:text-gray-500">Tap to flip</span>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 flex items-center justify-center p-8">
                            <p className="text-2xl font-semibold text-center text-blue-900 dark:text-blue-100">{currentCard.back}</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleReview(1); }}
                        className="px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 font-semibold rounded-xl transition-colors"
                    >
                        Hard
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleReview(3); }}
                        className="px-6 py-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 font-semibold rounded-xl transition-colors"
                    >
                        Good
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleReview(5); }}
                        className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 font-semibold rounded-xl transition-colors"
                    >
                        Easy
                    </button>
                </div>
            </div>

            {/* Global Status Indicator */}
            <OfflineStatusIndicator
                isOnline={isOnline}
                isSyncing={isSyncing}
                queueLength={queueLength}
                onManualSync={triggerSync}
            />

            <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
        </div>
    );
};

export default OfflineStudyMode;
