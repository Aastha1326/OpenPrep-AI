import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface MathRendererProps {
    content: string;
    className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
    // Parser helper: renders LaTeX equations and standard text gracefully
    const renderParsedContent = (rawText: string) => {
        if (!rawText) return null;

        // Split text by block math $$...$$ and inline math $...$
        const parts = rawText.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

        return parts.map((part, index) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                const expr = part.slice(2, -2).trim();
                return (
                    <div key={index} className="my-3 p-3 bg-slate-950/80 border border-indigo-500/20 rounded-xl overflow-x-auto text-center font-mono text-xs sm:text-sm text-indigo-300 shadow-inner">
                        {expr}
                    </div>
                );
            } else if (part.startsWith('$') && part.endsWith('$')) {
                const expr = part.slice(1, -1).trim();
                return (
                    <span key={index} className="inline-block px-1.5 py-0.5 mx-0.5 bg-slate-950 font-mono text-xs text-teal-300 rounded border border-teal-500/20">
                        {expr}
                    </span>
                );
            } else {
                return (
                    <span key={index} className="whitespace-pre-wrap">
                        {part}
                    </span>
                );
            }
        });
    };

    return (
        <div className={`prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-200 ${className}`}>
            {renderParsedContent(content)}
        </div>
    );
};
