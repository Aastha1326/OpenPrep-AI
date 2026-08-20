import React from 'react';
import { MathMarkdownEditor } from './MathMarkdownEditor';

export const MathEditorStudio: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
            <MathMarkdownEditor />
        </div>
    );
};

export default MathEditorStudio;
