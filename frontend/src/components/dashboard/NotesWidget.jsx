import { useState, useEffect, useCallback } from 'react';
import { FileText, Volume2, Loader, AlertCircle, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import API from '../../services/api';
import VintagePaper from './VintagePaper';
import AudioReader from '../AudioReader';
import HighlightedText from '../HighlightedText';

const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-neutral-300/60 rounded ${className}`} />
);

const NotesWidget = ({ limit = 5 }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [activeSentenceByNote, setActiveSentenceByNote] = useState({});

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/notes', { params: { limit } });
      const items = res?.data?.data;
      setNotes(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load notes.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const generateSummary = useCallback(async (noteId) => {
    setSummaries((prev) => ({ ...prev, [noteId]: { loading: true, error: null } }));
    try {
      const res = await API.post(`/notes/${noteId}/summarize`);
      const data = res?.data?.data;
      setSummaries((prev) => ({ ...prev, [noteId]: { data, loading: false, error: null } }));
    } catch (err) {
      setSummaries((prev) => ({
        ...prev,
        [noteId]: {
          loading: false,
          error: err?.response?.data?.error || 'Failed to summarize note.',
        },
      }));
    }
  }, []);

  const handleSentenceChange = useCallback(
    (noteId) => (index) => {
      setActiveSentenceByNote((prev) => (prev[noteId] === index ? prev : { ...prev, [noteId]: index }));
    },
    []
  );

  return (
    <VintagePaper className="shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
      <h2 className="text-2xl font-bold font-playfair text-neutral-900 mb-4 border-b border-neutral-400 pb-2 flex items-center gap-2">
        <FileText className="w-6 h-6 text-yellow-700" /> AI Revision Summaries
      </h2>
      <p className="text-xs text-neutral-500 italic -mt-2 mb-4">
        Generate a revision summary for a note, then listen to it with the audio reader.
      </p>

      {loading ? (
        <div className="space-y-3">
          <Shimmer className="h-6 w-2/3" />
          <Shimmer className="h-6 w-1/2" />
          <Shimmer className="h-6 w-3/4" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="w-8 h-8 text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-500">{error}</p>
          <button
            type="button"
            onClick={loadNotes}
            className="mt-3 flex items-center gap-1 text-yellow-700 hover:text-yellow-800 font-semibold text-xs uppercase tracking-wider"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <FileText className="w-10 h-10 text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-500 italic">
            No notes yet. Upload a note to generate revision summaries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const summary = summaries[note.id];
            const activeIndex = activeSentenceByNote[note.id] ?? -1;
            const summaryText = summary?.data?.summary || '';

            return (
              <div key={note.id} className="p-4 bg-white border border-neutral-300 rounded">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate">{note.title}</p>
                    {note.subject?.name && (
                      <p className="text-[10px] uppercase tracking-wider font-bold text-amber-800 mt-0.5">
                        {note.subject.name}
                      </p>
                    )}
                  </div>
                  {!summary && (
                    <button
                      type="button"
                      onClick={() => generateSummary(note.id)}
                      className="flex shrink-0 items-center gap-1 px-2.5 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold rounded"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Summarize
                    </button>
                  )}
                </div>

                {summary?.loading && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                    <Loader className="w-3.5 h-3.5 animate-spin" /> Generating AI summary&hellip;
                  </div>
                )}

                {summary?.error && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" /> {summary.error}
                  </div>
                )}

                {summary?.data && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" /> AI Revision Summary
                      </p>
                      <AudioReader
                        text={summaryText}
                        onSentenceChange={handleSentenceChange(note.id)}
                      />
                    </div>

                    {summaryText && (
                      <HighlightedText
                        text={summaryText}
                        activeIndex={activeIndex}
                        className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line"
                      />
                    )}

                    {Array.isArray(summary.data.keyConcepts) && summary.data.keyConcepts.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase">Key Concepts:</span>
                        {summary.data.keyConcepts.map((concept, idx) => (
                          <span key={idx} className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            {concept}
                          </span>
                        ))}
                      </div>
                    )}

                    {Array.isArray(summary.data.examTips) && summary.data.examTips.length > 0 && (
                      <ul className="mt-3 space-y-1 list-disc list-inside text-xs text-neutral-600">
                        {summary.data.examTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </VintagePaper>
  );
};

export default NotesWidget;
