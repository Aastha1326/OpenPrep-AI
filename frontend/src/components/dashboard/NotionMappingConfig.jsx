import React, { useState } from 'react';
import { Database, Key, Check } from 'lucide-react';

const NotionMappingConfig = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave) onSave({ apiKey, databaseId });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl">
      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Database className="text-blue-400" size={20} />
        Notion Database Property Mapping
      </h3>
      <p className="text-xs text-gray-400 mb-5">
        Provide your Notion integration secret and target study database ID
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Internal Integration Token
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="secret_..."
              className="w-full bg-gray-850 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <Key size={16} className="absolute right-3 top-3 text-gray-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Notion Database ID
          </label>
          <input
            type="text"
            value={databaseId}
            onChange={(e) => setDatabaseId(e.target.value)}
            placeholder="32-character database uuid"
            className="w-full bg-gray-850 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {saved ? <Check size={16} /> : null}
          {saved ? 'Settings Saved' : 'Save Notion Credentials'}
        </button>
      </form>
    </div>
  );
};

export default NotionMappingConfig;
