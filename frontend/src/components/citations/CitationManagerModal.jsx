import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Copy, Check, Download, Plus, X, Bookmark, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import CitationCard from './CitationCard';

const CitationManagerModal = ({ isOpen, onClose, onInsertCitation }) => {
  const [doiQuery, setDoiQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [activeStyle, setActiveStyle] = useState('apa');
  const [citations, setCitations] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');

  const fetchUserCitations = async () => {
    try {
      const res = await api.get('/citations');
      if (res.data?.data) {
        setCitations(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load user citations', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserCitations();
    }
  }, [isOpen]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!doiQuery.trim()) return;
    setLoading(true);
    setError('');
    setLookupResult(null);

    try {
      const res = await api.get(`/citations/lookup?doi=${encodeURIComponent(doiQuery.trim())}`);
      if (res.data?.data) {
        setLookupResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resolve DOI via CrossRef/OpenAlex');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCitation = async () => {
    if (!lookupResult?.metadata) return;
    try {
      await api.post('/citations', lookupResult.metadata);
      setLookupResult(null);
      setDoiQuery('');
      fetchUserCitations();
    } catch (err) {
      setError('Failed to save citation to library');
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = async (format) => {
    try {
      window.open(`/api/citations/export?format=${format}`, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Academic Citation Manager</h2>
              <p className="text-xs text-gray-400">Search DOI, auto-format in APA/IEEE/MLA/BibTeX, and export bibliographies</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search DOI Bar */}
        <div className="p-6 border-b border-gray-800 bg-gray-850/40">
          <form onSubmit={handleLookup} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={doiQuery}
                onChange={(e) => setDoiQuery(e.target.value)}
                placeholder="Enter DOI (e.g. 10.1145/3318464.3389700 or full URL)..."
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <Search size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={loading || !doiQuery.trim()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-all"
            >
              {loading ? 'Resolving...' : 'Lookup DOI'}
            </button>
          </form>

          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

          {lookupResult && (
            <div className="mt-4 p-4 bg-gray-900 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {lookupResult.metadata.year} • {lookupResult.metadata.journal || lookupResult.metadata.publisher}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1">{lookupResult.metadata.title}</h4>
                  <p className="text-xs text-gray-400">{lookupResult.metadata.authors.join(', ')}</p>
                </div>
                <button
                  onClick={handleSaveCitation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-gray-950 font-bold text-xs rounded-xl shadow hover:bg-emerald-400 transition-all"
                >
                  <Plus size={14} /> Add to Library
                </button>
              </div>

              <div className="pt-2 border-t border-gray-800 text-xs text-gray-300 font-mono bg-gray-950 p-2.5 rounded-xl">
                {lookupResult.styles[activeStyle] || lookupResult.styles.apa}
              </div>
            </div>
          )}
        </div>

        {/* Style Selector & Bibliography Library */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 bg-gray-800/80 p-1 rounded-xl border border-gray-700">
              {['apa', 'ieee', 'mla', 'bibtex'].map((style) => (
                <button
                  key={style}
                  onClick={() => setActiveStyle(style)}
                  className={`px-3 py-1 text-xs font-extrabold uppercase rounded-lg transition-all ${
                    activeStyle === style
                      ? 'bg-emerald-500 text-gray-950 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('bibtex')}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl text-xs font-semibold border border-gray-700 transition-all"
              >
                <Download size={13} /> Export .bib
              </button>
              <button
                onClick={() => handleExport('ris')}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl text-xs font-semibold border border-gray-700 transition-all"
              >
                <Download size={13} /> Export .ris
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {citations.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No citations in your library yet. Search a DOI above to save your first reference.
              </div>
            ) : (
              citations.map((c) => (
                <CitationCard
                  key={c.id}
                  citation={c}
                  styleKey={activeStyle}
                  onCopy={handleCopy}
                  isCopied={copiedId === c.id}
                  onInsert={onInsertCitation}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitationManagerModal;
