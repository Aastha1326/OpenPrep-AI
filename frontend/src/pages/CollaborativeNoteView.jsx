import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import API from '../services/api';
import CollaborativeEditor from '../components/notes/CollaborativeEditor';
import { buildSingleNoteDocument, exportHTMLToPDF } from '../utils/exportDocs';
import AudioReader from '../components/AudioReader';

export default function CollaborativeNoteView() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNoteDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/notes/${noteId}`);
      if (res.data?.success) {
        setNote(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to load collaborative note.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) {
      fetchNoteDetails();
    }
  }, [noteId]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-inter py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation / Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-200 text-xs font-bold transition cursor-pointer"
            aria-label="Return to Dashboard"
          >
            <FaArrowLeft /> Back to Dashboard
          </button>

          {note && (
            <div className="text-right">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Collaborative Room</span>
              <span className="text-xs font-bold text-indigo-400">{note.subjectRef?.name || 'General Subject'}</span>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-neutral-900 border border-neutral-800 rounded-3xl min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs text-stone-400 font-semibold">Opening collaboration room...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 font-semibold max-w-md mx-auto">
            <FaExclamationTriangle className="text-base shrink-0 animate-bounce" />
            <span>{error}</span>
          </div>
        ) : note ? (
          <div className="space-y-6">
            {/* Title Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-black font-playfair tracking-tight text-white flex items-center gap-2">
                  📝 {note.title}
                </h1>
                <AudioReader text={note.content || note.title} />
              </div>
              <p className="text-stone-400 text-xs">
                Real-time conflict resolution powered by CRDT algorithms.
              </p>
            </div>

            {/* Collaborative Editor Panel */}
            <CollaborativeEditor noteId={noteId} currentUser={user || {}} />
          </div>
        ) : null}

      </div>
    </div>
  );
}
