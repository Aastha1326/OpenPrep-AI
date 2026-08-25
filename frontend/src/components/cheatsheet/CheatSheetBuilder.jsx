import React, { useState } from 'react';
import { FileText, Plus, Printer, Columns2, Columns3, Save, Sparkles, Download } from 'lucide-react';
import FormulaEditorModal from './FormulaEditorModal';
import PrintableSheetCard from './PrintableSheetCard';

const initialSections = [
  {
    id: 's1',
    title: 'Differential Calculus Essentials',
    color: '#10B981',
    items: [
      { label: 'Power Rule', latex: '\\frac{d}{dx} [x^n] = n x^{n-1}' },
      { label: 'Chain Rule', latex: '\\frac{d}{dx} [f(g(x))] = f\'(g(x)) \\cdot g\'(x)' },
      { label: 'Euler Exponential', latex: '\\frac{d}{dx} [e^{kx}] = k e^{kx}' },
    ],
  },
  {
    id: 's2',
    title: 'Integral & Series Formulae',
    color: '#3B82F6',
    items: [
      { label: 'Integration by Parts', latex: '\\int u \\, dv = uv - \\int v \\, du' },
      { label: 'Gaussian Integral', latex: '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}' },
    ],
  },
];

const CheatSheetBuilder = () => {
  const [columns, setColumns] = useState(2);
  const [sections, setSections] = useState(initialSections);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);

  const handleAddFormula = (sectionId) => {
    setActiveSectionId(sectionId);
    setModalOpen(true);
  };

  const handleSaveFormula = (formulaData) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === activeSectionId) {
          return {
            ...sec,
            items: [...sec.items, formulaData],
          };
        }
        return sec;
      })
    );
    setModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-amber-400" size={24} />
            Interactive Exam Cheat-Sheet Builder
          </h3>
          <p className="text-xs text-gray-400">
            Compose high-density formula cards with live KaTeX rendering & vector print export
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-850 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setColumns(2)}
              className={`p-1.5 rounded-lg transition-all ${columns === 2 ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400'}`}
              title="2-Column Layout"
            >
              <Columns2 size={18} />
            </button>
            <button
              onClick={() => setColumns(3)}
              className={`p-1.5 rounded-lg transition-all ${columns === 3 ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400'}`}
              title="3-Column Layout"
            >
              <Columns3 size={18} />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-xl shadow transition-all"
          >
            <Printer size={15} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className={`grid gap-4 ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {sections.map((section) => (
          <PrintableSheetCard
            key={section.id}
            section={section}
            onAddFormula={() => handleAddFormula(section.id)}
          />
        ))}
      </div>

      <FormulaEditorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveFormula}
      />
    </div>
  );
};

export default CheatSheetBuilder;
