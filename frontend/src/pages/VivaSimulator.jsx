import React, { useState, useEffect } from 'react';
import API from '../services/api';
import VivaSimulatorCanvas from '../components/viva/VivaSimulatorCanvas';
import VivaScorecardModal from '../components/viva/VivaScorecardModal';
import { FaGraduationCap, FaAngleRight, FaExclamationCircle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export default function VivaSimulator() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [turns, setTurns] = useState([]);
  const [nextQuestion, setNextQuestion] = useState('');
  const [scorecard, setScorecard] = useState(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await API.get('/subjects');
      if (res.data?.success) {
        setSubjects(res.data.data || []);
        if (res.data.data.length > 0) {
          setSelectedSubjectId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load subjects list.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleStartViva = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    setError('');
    setScorecard(null);
    try {
      const res = await API.post('/viva/start', { subjectId: selectedSubjectId });
      if (res.data?.success) {
        setSessionId(res.data.data.sessionId);
        setTurns(res.data.data.turns || []);
        setNextQuestion(res.data.data.nextQuestion || '');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to start viva session.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (studentAnswer) => {
    setLoading(true);
    setError('');

    // Optimistically update turns to display student response immediately
    const tempTurns = [...turns, { speaker: 'student', text: studentAnswer }];
    setTurns(tempTurns);

    try {
      // 1. Submit response
      const res = await API.post('/viva/respond', {
        sessionId,
        studentAnswer,
      });

      if (res.data?.success) {
        // Count student answers
        const studentTurnsCount = tempTurns.filter((t) => t.speaker === 'student').length;

        // Auto evaluate after 5 turns (exchanges) to match acceptance criteria
        if (studentTurnsCount >= 5) {
          await handleEvaluate();
        } else {
          setTurns(res.data.data.turns || []);
          setNextQuestion(res.data.data.nextQuestion || '');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to submit response.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/viva/evaluate', { sessionId });
      if (res.data?.success) {
        setScorecard(res.data.data);
        setIsScorecardOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to generate performance scorecard.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setSessionId(null);
    setTurns([]);
    setNextQuestion('');
    setScorecard(null);
    setIsScorecardOpen(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const studentTurnsCount = turns.filter((t) => t.speaker === 'student').length;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-inter py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black font-playfair tracking-tight text-white flex items-center gap-2">
              <FaGraduationCap className="text-indigo-400" /> AI Practice Viva Simulator
            </h1>
            <p className="text-stone-400 text-xs mt-1">
              Practice real-time technical viva questions under exam pressure.
            </p>
          </div>
          {sessionId && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block">Progress</span>
                <span className="text-xs font-bold text-stone-300">Turn {studentTurnsCount} / 5</span>
              </div>
              <button
                onClick={handleEvaluate}
                disabled={loading || studentTurnsCount < 2}
                className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 disabled:opacity-50 text-stone-300 border border-neutral-750 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Finish Early
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 font-semibold">
            <FaExclamationCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loadingSubjects ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs text-stone-400 font-semibold">Loading subjects...</p>
          </div>
        ) : !sessionId ? (
          /* Session Start / Selector Setup */
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl max-w-xl mx-auto space-y-6">
            <div className="space-y-2">
              <h2 className="text-stone-100 font-extrabold font-playfair text-xl">Oral Examination Simulator</h2>
              <p className="text-stone-400 text-xs leading-relaxed">
                Choose a subject to configure your oral technical viva session. The examiner persona will ask complex technical follow-up questions to test your accuracy and clarity.
              </p>
            </div>

            {subjects.length === 0 ? (
              <div className="p-4 rounded-xl border border-neutral-850 bg-stone-950/20 text-center text-xs text-stone-500">
                Please create subjects in the Dashboard before simulating a practice interview.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="subject-select" className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Select Subject</label>
                  <select
                    id="subject-select"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-stone-950 border border-neutral-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-stone-300 outline-none transition cursor-pointer"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleStartViva}
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition shadow-lg hover:shadow-indigo-500/10 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enter Examination Room</span>
                      <FaAngleRight />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Active Simulator Arena */
          <div className="space-y-6">
            <VivaSimulatorCanvas
              turns={turns}
              nextQuestion={nextQuestion}
              onRespond={handleRespond}
              loading={loading}
            />
          </div>
        )}

        {/* Evaluation Scorecard Modal */}
        <VivaScorecardModal
          isOpen={isScorecardOpen}
          onClose={() => setIsScorecardOpen(false)}
          scorecard={scorecard}
          onRestart={handleRestart}
        />

      </div>
    </div>
  );
}
