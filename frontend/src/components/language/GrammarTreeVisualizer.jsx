import React, { useState } from 'react';
import { Languages, GitMerge, BookCheck, Sparkles } from 'lucide-react';
import ConjugationMatrixTable from './ConjugationMatrixTable';

const sampleTree = {
  sentence: 'Los estudiantes aprenden gramática rápidamente',
  nodes: [
    { label: 'Los', pos: 'ARTICLE', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { label: 'estudiantes', pos: 'SUBJECT (NOUN)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { label: 'aprenden', pos: 'PREDICATE (VERB)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { label: 'gramática', pos: 'DIRECT OBJECT', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { label: 'rápidamente', pos: 'ADVERB', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  ],
};

const GrammarTreeVisualizer = () => {
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'drills'
  const [inputSentence, setInputSentence] = useState(sampleTree.sentence);

  return (
    <div className="bg-gray-900/70 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/10 text-pink-400 rounded-2xl border border-pink-500/20">
            <Languages size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Language Conjugator & Grammar Tree Studio</h3>
            <p className="text-xs text-gray-400">POS Syntax Trees, Spaced-Repetition Verb Matrices & Accent Validation</p>
          </div>
        </div>

        <div className="flex bg-gray-850 p-1 rounded-xl border border-gray-700">
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tree' ? 'bg-pink-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <GitMerge size={13} /> Syntax Tree
          </button>
          <button
            onClick={() => setActiveTab('drills')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'drills' ? 'bg-pink-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookCheck size={13} /> Verb Drill Table
          </button>
        </div>
      </div>

      {activeTab === 'tree' ? (
        <div className="space-y-4">
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 space-y-6">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Hierarchical Sentence Syntax Tree
            </div>

            {/* Tree Node Visualizer */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-4">
              {sampleTree.nodes.map((n, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`px-4 py-3 rounded-2xl border flex flex-col items-center gap-1 shadow-lg ${n.color}`}>
                    <span className="font-bold text-sm">{n.label}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">{n.pos}</span>
                  </div>
                  {idx < sampleTree.nodes.length - 1 && (
                    <span className="text-gray-600 font-bold">➔</span>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300 leading-relaxed">
              <span className="font-bold text-pink-400">Grammar Insight:</span> "Los estudiantes" forms the plural subject noun phrase governing the 3rd-person plural verb "aprenden" (Present indicative of *aprender*), taking the direct object "gramática".
            </div>
          </div>
        </div>
      ) : (
        <ConjugationMatrixTable />
      )}
    </div>
  );
};

export default GrammarTreeVisualizer;
