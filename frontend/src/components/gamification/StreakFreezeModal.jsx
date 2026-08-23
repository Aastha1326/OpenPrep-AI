import React, { useState } from 'react';
import { Shield, Sparkles, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const StreakFreezeModal = ({ isOpen, onClose, userFreezes = 1, userXP = 500, onPurchaseSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/gamification/streak-freeze/buy');
      if (onPurchaseSuccess) onPurchaseSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to purchase streak freeze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Shield size={42} />
          </div>

          <h3 className="text-xl font-bold text-white">Streak Freeze Shield</h3>
          <p className="text-sm text-gray-300">
            Protects your active study streak if you miss a study day. Current inventory: <strong className="text-blue-400">{userFreezes} / 3</strong>
          </p>

          <div className="p-4 rounded-2xl bg-gray-850 border border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-400">Cost:</span>
            <span className="text-yellow-400 font-bold flex items-center gap-1">
              <Sparkles size={16} /> 300 XP
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            onClick={handlePurchase}
            disabled={loading || userFreezes >= 3 || userXP < 300}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            {loading ? 'Purchasing...' : userFreezes >= 3 ? 'Inventory Full (Max 3)' : 'Purchase Shield (300 XP)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreakFreezeModal;
