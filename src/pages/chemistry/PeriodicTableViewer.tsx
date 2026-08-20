import React from 'react';
import { PeriodicTableGrid } from './PeriodicTableGrid';

export const PeriodicTableViewer: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
            <PeriodicTableGrid />
        </div>
    );
};

export default PeriodicTableViewer;
