import React, { useState, useEffect } from 'react';
import { Printer, Sparkles, Filter, Loader2, BookOpen } from 'lucide-react';
import API from '../services/api';

export default function CheatSheetView() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [cheatSheet, setCheatSheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch subjects on mount
  useEffect(() => {
    API.get('/subjects')
      .then((res) => setSubjects(res.data.subjects || []))
      .catch(() => setError('Failed to load subjects.'));
  }, []);

  const handleGenerate = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    setError('');

    try {
      let url = `/ai/generate-cheatsheet?subjectId=${selectedSubject}`;
      if (selectedChapter) url += `&chapterId=${selectedChapter}`;

      const response = await API.get(url);
      if (response.data.success) {
        setCheatSheet(response.data.cheatSheet);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate cheat sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentSubjectObj = subjects.find((s) => s.id.toString() === selectedSubject);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 font-inter text-[#1F150C] dark:text-[#E1DCC9]">
      {/* Header & Controls (Hidden during print) */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#FFFBE9] dark:bg-[#16120E] p-6 rounded-2xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-playfair flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> AI Formula Cheat Sheet Generator
          </h1>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mt-1">
            Aggregate key formulas, definitions, and theorems per subject and chapter instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => { setSelectedSubject(e.target.value); setSelectedChapter(''); }}
            className="px-3 py-2 bg-[#FFFBE9] dark:bg-[#251D17] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Chapter Filter */}
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            disabled={!currentSubjectObj?.chapters?.length}
            className="px-3 py-2 bg-[#FFFBE9] dark:bg-[#251D17] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-xs font-semibold focus:outline-none disabled:opacity-50"
          >
            <option value="">All Chapters</option>
            {currentSubjectObj?.chapters?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={!selectedSubject || loading}
            className="px-4 py-2 rounded-xl btn-primary-theme font-bold text-xs shadow cursor-pointer flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Cheat Sheet
          </button>

          {cheatSheet && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-amber-400 border border-amber-700/50 hover:bg-neutral-700 font-bold text-xs shadow cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-bold">Synthesizing formulas and theorems with Gemini AI...</p>
        </div>
      )}

      {/* Printable Cheat Sheet View (2-Column Layout for Print) */}
      {cheatSheet && !loading && (
        <div className="bg-white dark:bg-[#16120E] p-8 rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-lg print:shadow-none print:border-none print:p-0">
          <div className="border-b border-black/10 dark:border-white/10 pb-4 mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold font-playfair text-[#1F150C] dark:text-[#E1DCC9]">
                {cheatSheet.subjectName} — Formula Cheat Sheet
              </h2>
              <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mt-1">Quick-Reference Revision Guide</p>
            </div>
            <span className="text-xs font-mono text-neutral-400 print:block">OpenPrep AI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6">
            {cheatSheet.sections?.map((section, idx) => (
              <div key={idx} className="bg-[#FFFBE9]/40 dark:bg-[#251D17]/50 p-5 rounded-2xl border border-[#CEAB93]/30 dark:border-[#412D15] break-inside-avoid">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 border-b border-[#CEAB93]/20 pb-1.5">
                  {section.category}
                </h3>
                <div className="space-y-4">
                  {section.items?.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="font-bold text-xs text-[#1F150C] dark:text-[#E1DCC9]">{item.title}</div>
                      <div className="p-2.5 bg-white dark:bg-black/30 rounded-xl border border-[#CEAB93]/20 font-mono text-xs text-amber-700 dark:text-amber-300">
                        {item.formula}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-[#8C6A53] dark:text-[#C4BA9D]">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
