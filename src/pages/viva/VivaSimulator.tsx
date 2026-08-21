import React from 'react';
import { VivaSimulatorCanvas } from './VivaSimulatorCanvas';

export const VivaSimulator: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
            <VivaSimulatorCanvas />
        </div>
    );
};

export default VivaSimulator;
