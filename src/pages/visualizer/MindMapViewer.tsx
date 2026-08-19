import React from 'react';
import { MindMapCanvas } from './MindMapCanvas';

export const MindMapViewer: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
            <MindMapCanvas />
        </div>
    );
};

export default MindMapViewer;
