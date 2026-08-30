import React, { useState } from 'react';
import { X, Send, Network } from 'lucide-react';

const AlumniConnectionModal = ({ isOpen, mentor, onClose }) => {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // idle, sending, success

    if (!isOpen || !mentor) return null;

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setStatus('sending');

        // Pseudo-network request
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setMessage('');
            }, 2000);
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-gray-900 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header Gradient Block */}
                <div className="h-32 w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full p-2">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute -bottom-8 left-8 w-16 h-16 bg-gray-800 border-4 border-gray-900 rounded-full flex items-center justify-center">
                        <Network className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                <div className="p-8 pt-12">
                    {status === 'success' ? (
                        <div className="py-8 text-center animate-in slide-in-from-bottom-2">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Request Sent!</h2>
                            <p className="text-gray-400">Your connection request to {mentor.fullName} was successfully delivered.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    Request Mentorship
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Send a personalized message to <strong>{mentor.fullName}</strong> ({mentor.currentRole} @ {mentor.currentCompany}).
                                </p>
                            </div>

                            <form onSubmit={handleSend} className="space-y-4">
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={`Hi ${mentor.fullName},\n\nI'm a senior majoring in Computer Science and I'd love to learn more about your journey to ${mentor.currentCompany}...`}
                                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-gray-200 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder-gray-600 resize-none transition-all"
                                />

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={status === 'sending' || !message.trim()}
                                        className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        {status === 'sending' ? (
                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                                        ) : (
                                            <><Send className="w-4 h-4" /> Send Request</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlumniConnectionModal;
