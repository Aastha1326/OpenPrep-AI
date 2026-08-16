import { FaBook, FaRegCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Loader2, Sparkles as FaSparkles } from 'lucide-react';
import API from '../../services/api';

export default function SyllabusCoverageMatrix({ syllabusName, initialCoverage = 0, initialTopics = [], syllabusId }) {
  const [topics, setTopics] = useState(initialTopics);
  const [coverage, setCoverage] = useState(initialCoverage);
  const [generatingTopicId, setGeneratingTopicId] = useState(null);

  const handleGenerateNotes = async (topicId) => {
    setGeneratingTopicId(topicId);
    try {
      const res = await API.post(`/syllabus/topics/${topicId}/generate-notes`);
      if (res.data?.success) {
        // Update local status to Partially Covered
        setTopics((prev) =>
          prev.map((t) =>
            t.id === topicId
              ? { ...t, coverageStatus: 'Partially Covered', linkedNoteId: res.data.data.noteId }
              : t
          )
        );
        // Refresh coverage percentage
        const updatedRes = await API.get(`/syllabus/${syllabusId}/gap-analysis`);
        if (updatedRes.data?.success) {
          setCoverage(updatedRes.data.data.coveragePercentage);
        }
      }
    } catch (err) {
      console.error('Failed to generate AI notes:', err);
      alert('Failed to generate notes. Please try again.');
    } finally {
      setGeneratingTopicId(null);
    }
  };

  // Group topics by Module
  const modules = {};
  topics.forEach((t) => {
    const mod = t.moduleName || 'General Module';
    if (!modules[mod]) {
      modules[mod] = [];
    }
    modules[mod].push(t);
  });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
      
      {/* Overview Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 gap-4">
        <div>
          <h3 className="text-stone-100 font-extrabold font-playfair text-lg flex items-center gap-2">
            <FaBook className="text-indigo-400" /> {syllabusName || 'Course Curriculum'}
          </h3>
          <p className="text-stone-400 text-xs mt-0.5">Hierarchical modules & unstudied syllabus blind spots</p>
        </div>
        <div className="flex items-center gap-3 bg-stone-950/40 p-3 rounded-2xl border border-neutral-850">
          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Syllabus Coverage</span>
            <span className="text-2xl font-black text-indigo-400">{coverage}%</span>
          </div>
          <div className="w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden shrink-0">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${coverage}%` }} />
          </div>
        </div>
      </div>

      {/* Modules Listings */}
      <div className="space-y-6">
        {Object.entries(modules).map(([moduleName, moduleTopics]) => (
          <div key={moduleName} className="space-y-3 bg-stone-950/20 p-3 sm:p-4 rounded-2xl border border-neutral-850/80">
            <h4 className="text-stone-300 font-extrabold text-xs uppercase tracking-wider border-b border-neutral-850 pb-2">
              📂 {moduleName}
            </h4>
            
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-stone-400 font-bold border-b border-neutral-850/40">
                    <th className="py-2.5">Topic</th>
                    <th className="py-2.5">Sub-topics</th>
                    <th className="py-2.5 text-center">Weightage</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850/20">
                  {moduleTopics.map((topic) => {
                    let statusColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                    if (topic.coverageStatus === 'Covered') {
                      statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                    } else if (topic.coverageStatus === 'Partially Covered') {
                      statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                    }

                    return (
                      <tr key={topic.id} className="hover:bg-neutral-850/20 transition-colors">
                        <td className="py-3 font-semibold text-stone-200">{topic.title}</td>
                        <td className="py-3 text-stone-400 font-medium max-w-xs truncate" title={topic.subtopics?.join(', ')}>
                          {topic.subtopics?.join(', ') || '-'}
                        </td>
                        <td className="py-3 text-center text-stone-300 font-bold">{topic.weightage || 0}%</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                            {topic.coverageStatus === 'Covered' && <FaRegCheckCircle />}
                            {topic.coverageStatus === 'Partially Covered' && <FaExclamationTriangle />}
                            {topic.coverageStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {topic.coverageStatus === 'Unstudied Gap' && (
                            <button
                              onClick={() => handleGenerateNotes(topic.id)}
                              disabled={generatingTopicId !== null}
                              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 hover:border-indigo-400 hover:text-white rounded-lg text-[10px] font-bold text-indigo-400 transition cursor-pointer inline-flex items-center gap-1.5 ml-auto min-h-[44px]"
                            >
                              {generatingTopicId === topic.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <FaSparkles />
                              )}
                              Notes
                            </button>
                          )}
                          {topic.coverageStatus === 'Partially Covered' && topic.linkedNoteId && (
                            <a
                              href={`/uploads/${topic.linkedNoteId}`}
                              className="text-[10px] font-bold text-stone-400 hover:text-stone-200 underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Notes
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
