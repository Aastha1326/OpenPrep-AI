import React from 'react';
import { Server, Database, Cpu, Globe, Layers, ShieldCheck, HardDrive } from 'lucide-react';

export const NodeComponent = ({ node, isSelected, onClick }) => {
    const getNodeIcon = (type) => {
        switch (type) {
            case 'client': return <Globe className="w-4 h-4 text-sky-400" />;
            case 'load_balancer': return <Layers className="w-4 h-4 text-amber-400" />;
            case 'api_gateway': return <ShieldCheck className="w-4 h-4 text-teal-400" />;
            case 'microservice': return <Cpu className="w-4 h-4 text-indigo-400" />;
            case 'cache': return <HardDrive className="w-4 h-4 text-rose-400" />;
            case 'database': return <Database className="w-4 h-4 text-emerald-400" />;
            default: return <Server className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div
            onClick={() => onClick(node)}
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
            className={`absolute px-4 py-3 rounded-2xl border bg-slate-900/90 shadow-xl cursor-pointer transition-all flex items-center gap-2.5 ${
                isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105'
                    : 'border-slate-800 hover:border-slate-700'
            }`}
        >
            <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                {getNodeIcon(node.type)}
            </div>
            <div>
                <h5 className="text-xs font-bold text-slate-100 whitespace-nowrap">{node.label}</h5>
                <span className="text-[9px] font-mono text-slate-400 uppercase">{node.type.replace('_', ' ')}</span>
            </div>
        </div>
    );
};
