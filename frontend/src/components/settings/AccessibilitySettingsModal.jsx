/**
 * @fileoverview Modal for adjusting theme, font scale, dyslexic font, and reduced motion.
 */
import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const AccessibilitySettingsModal = ({ isOpen, onClose }) => {
    const {
        theme, setTheme,
        fontScale, setFontScale,
        useDyslexicFont, setUseDyslexicFont,
        reduceMotion, setReduceMotion
    } = useTheme();

    if (!isOpen) return null;

    const themes = [
        { id: 'light', name: 'Light', desc: 'Default bright theme' },
        { id: 'dark', name: 'Dark', desc: 'Easy on the eyes at night' },
        { id: 'oled', name: 'Midnight OLED', desc: 'Pure black for battery saving' },
        { id: 'sepia', name: 'Sepia', desc: 'Warm tones for long reading' },
        { id: 'high-contrast', name: 'High Contrast', desc: 'WCAG AAA compliance' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="accessibility-title">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 id="accessibility-title" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Accessibility & Theme Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close settings"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">

                    {/* Theme Selection */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Theme</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${theme === t.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    aria-pressed={theme === t.id}
                                >
                                    <div className={`w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0 ${t.id === 'light' ? 'bg-white' :
                                        t.id === 'dark' ? 'bg-gray-800' :
                                            t.id === 'oled' ? 'bg-black' :
                                                t.id === 'sepia' ? 'bg-[#f4ecd8]' :
                                                    'bg-black border-2 border-white'
                                        }`} />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Font Scale */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Text Size</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">A</span>
                            <input
                                type="range"
                                min="0.9"
                                max="1.4"
                                step="0.1"
                                value={fontScale}
                                onChange={(e) => setFontScale(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                aria-label="Font size scale"
                            />
                            <span className="text-xl text-gray-900 dark:text-white font-bold">A</span>
                            <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-12 text-right">{Math.round(fontScale * 100)}%</span>
                        </div>
                    </section>

                    {/* Toggles */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reading Preferences</h3>

                        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">OpenDyslexic Font</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Use a font designed to improve reading for dyslexia.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={useDyslexicFont}
                                onChange={(e) => setUseDyslexicFont(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Reduced Motion</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Disable non-essential animations and transitions.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={reduceMotion}
                                onChange={(e) => setReduceMotion(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                            />
                        </label>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessibilitySettingsModal;
