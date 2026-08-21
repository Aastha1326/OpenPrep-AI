import React, { useState } from 'react';
import { 
    Volume2, 
    RotateCcw, 
    Sparkles, 
    BookOpen, 
    Sliders, 
    Layers, 
    ChevronRight, 
    ChevronLeft,
    Brain,
    Globe
} from 'lucide-react';
import { VocabularyFlashcard, SpeechSettings, PRESET_VOCABULARY_DECK } from './pronounceEngine';
import { AudioPronounceButton } from './AudioPronounceButton';

export const VocabularyFlashcardStudio: React.FC = () => {
    const [deck] = useState<VocabularyFlashcard[]>(PRESET_VOCABULARY_DECK);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [speechSettings, setSpeechSettings] = useState<SpeechSettings>({
        rate: 1.0,
        pitch: 1.0,
        voiceURI: null,
        language: 'en-US'
    });

    const activeCard = deck[currentIndex];

    const handleNextCard = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % deck.length);
    };

    const handlePrevCard = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev - 1 + deck.length) % deck.length);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                        <Volume2 className="w-4 h-4" />
                        Web Speech API Pronunciation Reader
                    </div>
                    <h1 className="text-2xl font-black text-slate-100 mt-1">Technical Vocabulary Audio Reader</h1>
                    <p className="text-xs text-slate-400">Listen to accurate audio pronunciations of complex medical, scientific, and technical terms.</p>
                </div>

                {/* Speech Speed Rate Selector */}
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium px-2">Voice Speed:</span>
                    {([0.75, 1.0, 1.25, 1.5] as const).map((rate) => (
                        <button
                            key={rate}
                            type="button"
                            onClick={() => setSpeechSettings({ ...speechSettings, rate })}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                                speechSettings.rate === rate
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {rate}x
                        </button>
                    ))}
                </div>
            </div>

            {/* Flashcard Active Deck Display */}
            <div className="relative group perspective-1000">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl min-h-[380px] flex flex-col justify-between relative overflow-hidden transition-all duration-300">
                    {/* Background Ambient Gradient */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                    {/* Card Header Info */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 capitalize">
                                {activeCard.domain} Domain
                            </span>
                            <span className="text-xs text-slate-400 font-semibold capitalize">
                                • {activeCard.difficulty} Level
                            </span>
                        </div>

                        <span className="text-xs font-mono text-slate-400 font-bold">
                            Card {currentIndex + 1} of {deck.length}
                        </span>
                    </div>

                    {/* Flashcard Main Center Body */}
                    <div className="my-8 text-center space-y-4 relative z-10">
                        <div className="inline-block">
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
                                {activeCard.term}
                            </h2>
                            <p className="text-sm font-mono text-teal-400 font-medium mt-1">
                                {activeCard.phoneticIpa}
                            </p>
                        </div>

                        {/* Pronounce Audio Trigger Button */}
                        <div className="pt-2">
                            <AudioPronounceButton
                                textToSpeak={activeCard.term}
                                label="Listen Pronunciation"
                                settings={speechSettings}
                                size="lg"
                            />
                        </div>

                        {/* Definition revealed on flip */}
                        {isFlipped ? (
                            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left space-y-2 animate-fade-in mt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Definition:</h4>
                                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{activeCard.definition}</p>
                                <p className="text-xs text-slate-400 italic mt-2">"{activeCard.exampleSentence}"</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline mt-4 block mx-auto"
                            >
                                Click to Reveal Definition & Example
                            </button>
                        )}
                    </div>

                    {/* Card Footer Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 relative z-10">
                        <button
                            onClick={handlePrevCard}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous Term
                        </button>

                        <button
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition-colors"
                        >
                            {isFlipped ? "Hide Definition" : "Reveal Definition"}
                        </button>

                        <button
                            onClick={handleNextCard}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-colors"
                        >
                            Next Term <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
