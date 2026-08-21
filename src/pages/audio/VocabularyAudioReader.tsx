import React from 'react';
import { VocabularyFlashcardStudio } from './VocabularyFlashcardStudio';

export const VocabularyAudioReader: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
            <VocabularyFlashcardStudio />
        </div>
    );
};

export default VocabularyAudioReader;
