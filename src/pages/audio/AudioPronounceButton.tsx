import React, { useState } from 'react';
import { Volume2, VolumeX, RefreshCw, Sliders } from 'lucide-react';
import { speakTermAudio, SpeechSettings } from './pronounceEngine';

interface AudioPronounceButtonProps {
    textToSpeak: string;
    label?: string;
    settings: SpeechSettings;
    size?: 'sm' | 'md' | 'lg';
}

export const AudioPronounceButton: React.FC<AudioPronounceButtonProps> = ({
    textToSpeak,
    label,
    settings,
    size = 'md'
}) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    const handlePlaySpeech = () => {
        setIsPlaying(true);
        setHasError(false);

        const success = speakTermAudio(
            textToSpeak,
            settings,
            () => setIsPlaying(false),
            (err) => {
                setIsPlaying(false);
                setHasError(true);
            }
        );

        if (!success) {
            setIsPlaying(false);
            setHasError(true);
        }
    };

    const sizeClasses = {
        sm: "px-2.5 py-1 text-xs gap-1.5",
        md: "px-3.5 py-2 text-xs font-bold gap-2",
        lg: "px-5 py-3 text-sm font-extrabold gap-2.5"
    }[size];

    return (
        <button
            type="button"
            onClick={handlePlaySpeech}
            disabled={isPlaying}
            title={`Pronounce "${textToSpeak}" at ${settings.rate}x speed`}
            aria-label={`Pronounce ${textToSpeak}`}
            className={`inline-flex items-center justify-center rounded-2xl font-semibold transition-all border shadow-lg ${
                isPlaying
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 animate-pulse shadow-emerald-500/10'
                    : hasError
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20 hover:border-indigo-500/50'
            } ${sizeClasses}`}
        >
            {isPlaying ? (
                <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-4 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            ) : hasError ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
                <Volume2 className="w-4 h-4 text-indigo-400" />
            )}
            
            <span>{label || (isPlaying ? 'Speaking...' : `Pronounce (${settings.rate}x)`)}</span>
        </button>
    );
};
