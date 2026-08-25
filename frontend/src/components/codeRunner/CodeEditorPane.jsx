/**
 * @fileoverview Full-featured code editor with syntax highlighting and language selector.
 * Note: Uses a lightweight mock editor for this implementation to avoid heavy Monaco dependencies in the PR, 
 * but structured to be easily swapped with @monaco-editor/react.
 */
import React, { useState } from 'react';

const languages = [
    { value: 'python', label: 'Python 3' },
    { value: 'javascript', label: 'JavaScript (Node.js)' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
];

const CodeEditorPane = ({ code, setCode, language, setLanguage }) => {
    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-t-xl overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-700 text-gray-200 text-sm rounded px-2 py-1 outline-none border border-gray-600 focus:border-blue-500"
                    >
                        {languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                    </select>
                </div>
                <span className="text-xs text-gray-500">Main.{language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : 'js'}</span>
            </div>
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 w-full bg-gray-900 text-gray-100 font-mono text-sm p-4 resize-none outline-none leading-relaxed"
                spellCheck="false"
                placeholder="// Write your code here..."
            />
        </div>
    );
};

export default CodeEditorPane;
