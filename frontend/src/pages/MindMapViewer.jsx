import React, { useState, useEffect } from 'react';
import { Sparkles, Network, BookOpen, Layers, RefreshCw, AlertCircle, GitBranch, Award } from 'lucide-react';import MindMapCanvas from '../components/visualizer/MindMapCanvas';
import NodeDetailModal from '../components/visualizer/NodeDetailModal';
import API from '../services/api';

export default function MindMapViewer() {
const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [textInput, setTextInput] = useState('');
  const [viewMode, setViewMode] = useState('ai'); // 'ai' | 'mastery'
  const [aiMindMapData, setAiMindMapData] = useState(null);
  const [masteryMindMapData, setMasteryMindMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedNode, setSelectedNode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    fetchSubjects();
    // Default initial mock/generated mind map
    handleGenerateMindMap();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await API.get('/subjects');
      setSubjects(res.data?.data || res.data || []);
    } catch (err) {
      console.warn('Could not fetch subjects:', err);
    }
  };

  const handleGenerateMindMap = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        subjectId: selectedSubjectId || undefined,
        textContext: textInput.trim() || undefined,
      };

const res = await API.post('/ai/mind-map/generate', payload);
      const data = res.data?.data?.nodesData || res.data?.data || res.data;
      setAiMindMapData(data);    } catch (err) {
      console.error('Failed to generate mind map:', err);
      setError(err.response?.data?.error || 'Failed to generate concept mind map. Please try again.');
    } finally {
      setLoading(false);
    }
};

  const getMasteryTierLabel = (pct) => {
    if (pct === null || pct === undefined || pct === 0) return 'Unstudied';
    if (pct >= 80) return 'Mastered';
    if (pct >= 50) return 'In Progress';
    return 'Weak';
  };

  const buildMasteryGraph = (masteryPayload) => {
    const nodes = [];
    const edges = [];
    (masteryPayload?.subjects || []).forEach((subject) => {
      const subjectNodeId = `subject-${subject.id}`;
      nodes.push({
        id: subjectNodeId,
        label: subject.name,
        category: 'root',
        masteryPercentage: subject.masteryPercentage,
        masteryTier: getMasteryTierLabel(subject.masteryPercentage),
        description: `Overall subject mastery: ${subject.masteryPercentage}%`,
      });
      (subject.chapters || []).forEach((chapter) => {
        const chapterNodeId = `topic-${chapter.id}`;
        nodes.push({
          id: chapterNodeId,
          label: chapter.name,
          category: 'topic',
          masteryPercentage: chapter.masteryPercentage,
          masteryTier: getMasteryTierLabel(chapter.masteryPercentage),
          description: `Chapter mastery: ${chapter.masteryPercentage}%`,
        });
        edges.push({
          id: `edge-${subjectNodeId}-${chapterNodeId}`,
          source: subjectNodeId,
          target: chapterNodeId,
        });
      });
    });
    return { title: 'Syllabus Mastery Mind Map', nodes, edges };
  };

  const handleLoadMasteryMap = async () => {
    setViewMode('mastery');
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/progress/mastery');
      const payload = res.data?.data || res.data;
      setMasteryMindMapData(buildMasteryGraph(payload));
    } catch (err) {
      console.error('Failed to load syllabus mastery map:', err);
      setError(err.response?.data?.error || 'Failed to load your syllabus mastery map. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (nodeData) => {    setSelectedNode(nodeData);
    setIsModalOpen(true);
  };

const handleLaunchQuiz = (conceptLabel) => {
    alert(`Launching quick practice quiz for concept: "${conceptLabel}"`);
  };

  const activeMindMapData = viewMode === 'ai' ? aiMindMapData : masteryMindMapData;

  return (    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-6">
{/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" /> AI Study Visualizer Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Interactive Topic Concept Mind Map
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Transform text notes or exam syllabus topics into dynamic 2D concept graphs. Zoom, pan, and click nodes to explore formulas, definitions, and flashcards.
          </p>
        </div>

        {/* View Mode Toggle: AI-generated concept map vs. real syllabus mastery map */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setViewMode('ai')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Concept Map
          </button>
          <button
            type="button"
            onClick={handleLoadMasteryMap}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'mastery' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Syllabus Mastery Map
          </button>
        </div>
      </div>
{/* Generator Controls Card (AI Concept Map mode) */}
      {viewMode === 'ai' && (
      <form onSubmit={handleGenerateMindMap} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Select Subject (Optional)
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">General Overview</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" /> Topic or Notes Context
            </label>
            <input
              type="text"
              placeholder="e.g. Binary Search Trees, Master Theorem, Graph Traversal Algorithms..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating Mind Map...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Concept Mind Map
              </>
            )}
          </button>
        </div>
</form>
      )}

      {/* Mastery Map Controls (Syllabus Mastery mode) */}
      {viewMode === 'mastery' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400 max-w-xl">
            Renders your actual subject → chapter syllabus hierarchy, color-coded by mastery computed from your quiz accuracy and flashcard retention.
          </p>
          <button
            type="button"
            onClick={handleLoadMasteryMap}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading Mastery Map...
              </>
            ) : (
              <>
                <Award className="w-4 h-4" /> Refresh Mastery Map
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Alert */}      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

{/* Mind Map Canvas Renderer */}
      {activeMindMapData && (
        <MindMapCanvas graphData={activeMindMapData} onNodeSelect={handleNodeClick} />
      )}
      {/* Node Detail Modal */}
      <NodeDetailModal
        node={selectedNode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLaunchQuiz={handleLaunchQuiz}
      />
    </div>
  );
}
