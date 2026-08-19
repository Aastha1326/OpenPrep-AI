import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Volume2,
  Loader,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckCircle,
  Layers,
  Mic,
  Play,
  Pause,
  Users,
} from 'lucide-react';
import API from '../../services/api';
import VintagePaper from './VintagePaper';
import AudioReader from '../AudioReader';
import HighlightedText from '../HighlightedText';
import GenerateFlashcardsFromNoteModal from './GenerateFlashcardsFromNoteModal';
import ImportExportNotes from './ImportExportNotes';
const VoiceNoteRecorderModal = lazy(() => import('../notes/VoiceNoteRecorderModal'));

const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-neutral-300/60 rounded ${className}`} />
);

const VoiceNotePlayer = ({ fileUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animationFrameRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      updateProgress();
    }
  };

  const updateProgress = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setProgress((current / duration) * 100);
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    cancelAnimationFrame(animationFrameRef.current);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const bars = Array.from({ length: 28 }, (_, i) => 10 + Math.abs(Math.sin(i)) * 25);

  const baseURL = API.defaults.baseURL || '';
  const cleanBaseURL = baseURL.replace(/\/api\/?$/, '');
  const audioSrc = fileUrl.startsWith('http') ? fileUrl : `${cleanBaseURL}${fileUrl}`;

  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50/60 dark:bg-slate-900/30 border border-amber-700/20 rounded mt-3">
      <audio ref={audioRef} src={audioSrc} onEnded={handleEnded} className="hidden" />

      <button
        type="button"
        onClick={togglePlay}
        className="p-2 bg-amber-700 hover:bg-amber-800 text-white rounded-full transition-colors flex items-center justify-center shadow"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-white" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex items-center gap-1 h-8 relative">
        {bars.map((height, i) => {
          const isActive = (i / bars.length) * 100 <= progress;
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-300"
              style={{
                height: `${height}px`,
                backgroundColor: isActive ? '#b45309' : '#d4d4d4',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const NotesWidget = ({ limit = 5 }) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [activeSentenceByNote, setActiveSentenceByNote] = useState({});
  const [flashcardNote, setFlashcardNote] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState('');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit };
      if (tagFilter.trim()) params.tag = tagFilter.trim();
      const res = await API.get('/notes', { params });
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
  }, [loadNotes, tagFilter]);

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
      setActiveSentenceByNote((prev) =>
        prev[noteId] === index ? prev : { ...prev, [noteId]: index }
      );
    },
    []
  );

  return (
    <VintagePaper className="shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
      <h2 className="text-2xl font-bold font-playfair text-neutral-900 mb-4 border-b border-neutral-400 pb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-yellow-700" /> AI Revision Summaries
        </span>
<span className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-sm shadow-sm transition-all"
          >
            <Mic className="w-3.5 h-3.5" /> Record Voice Note
          </button>
          <ImportExportNotes onImported={loadNotes} />
        </span>
      </h2>      <p className="text-xs text-neutral-500 italic -mt-2 mb-4">
        Generate a revision summary for a note, or record voice notes to summarize automatically.
      </p>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by tag (e.g. Important)..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600"
        />
      </div>

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
            const summary =
              summaries[note.id] || (note.aiSummary ? { data: note.aiSummary } : null);
            const activeIndex = activeSentenceByNote[note.id] ?? -1;
            const summaryText = summary?.data?.summary || '';

            return (
              <div
                key={note.id}
                className="p-4 bg-white border border-neutral-300 rounded shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate flex items-center gap-1.5">
                      {note.fileType === 'audio' && (
                        <Mic className="w-4 h-4 text-amber-700 shrink-0" />
                      )}
                      {note.title}
                    </p>
                    {note.subject?.name && (
                      <p className="text-[10px] uppercase tracking-wider font-bold text-amber-800 mt-0.5">
                        {note.subject.name}
                      </p>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {note.tags.map(t => (
                          <span key={t} className="text-[9px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded-sm">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!summary && (
                      <button
                        type="button"
                        onClick={() => generateSummary(note.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold rounded transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Summarize
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFlashcardNote(note)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold rounded transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" /> Generate AI Flashcards
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/notes/collaborative/${note.id}`)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" /> Collaborate
                    </button>
                  </div>
                </div>

                {note.fileType === 'audio' && note.fileUrl && (
                  <VoiceNotePlayer fileUrl={note.fileUrl} />
                )}

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
                        className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line font-serif"
                      />
                    )}

                    {Array.isArray(summary.data.keyConcepts) &&
                      summary.data.keyConcepts.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase">
                            Key Concepts:
                          </span>
                          {summary.data.keyConcepts.map((concept, idx) => (
                            <span
                              key={idx}
                              className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-bold"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}

                    {Array.isArray(summary.data.examTips) && summary.data.examTips.length > 0 && (
                      <ul className="mt-3 space-y-1 list-disc list-outside pl-6 text-xs text-neutral-600 font-serif">
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

      {flashcardNote && (
        <GenerateFlashcardsFromNoteModal
          note={flashcardNote}
          onClose={() => setFlashcardNote(null)}
          onImported={loadNotes}
        />
      )}

      <Suspense fallback={null}>
        <VoiceNoteRecorderModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onNoteCreated={loadNotes}
        />
      </Suspense>
    </VintagePaper>
  );
};

export default NotesWidget;
